import { verifySession } from './lib/auth.mjs';

const BASE_ID = process.env.AIRTABLE_BASE_ID || 'app11urE9NUz5itbf';
const TABLES = {
  contacts: process.env.AIRTABLE_CONTACTS_TABLE || 'Contacts',
  tasks: process.env.AIRTABLE_TASKS_TABLE || 'Tasks',
  hours: process.env.AIRTABLE_HOURS_TABLE || 'Hours',
  activity: process.env.AIRTABLE_ACTIVITY_TABLE || 'Task Activity',
};

const headers = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

function response(statusCode, body) {
  return { statusCode, headers, body: JSON.stringify(body) };
}

async function airtable(table, path = '', options = {}) {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) throw new Error('AIRTABLE_TOKEN is not configured');
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLES[table])}${path}`;
  const result = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await result.json().catch(() => ({}));
  if (!result.ok) throw new Error(data?.error?.message || `Airtable returned ${result.status}`);
  return data;
}

async function list(table) {
  let records = [];
  let offset = '';
  do {
    const query = new URLSearchParams({ pageSize: '100' });
    if (offset) query.set('offset', offset);
    const data = await airtable(table, `?${query}`);
    records = records.concat(data.records || []);
    offset = data.offset || '';
  } while (offset);
  return records;
}

function contactFromRecord(record, shared = {}) {
  const f = record.fields || {};
  return {
    id: record.id,
    name: f['Contact Name'] || 'Untitled contact',
    handle: f.Instagram || '',
    email: f.Email || '',
    brand: f.Brand || 'The Daily Session',
    type: f['Contact Type'] || 'Studio',
    offering: Array.isArray(f['Offering Type']) ? f['Offering Type'] : [],
    status: f.Stage === 'Follow Up' ? 'Follow Up Sent' : (f.Stage || 'Contacted'),
    note: f.Notes || '',
    due: f['Follow Up Date'] || '',
    lastSpotlightedClass: f['Last Spotlighted Class'] || '',
    lastSpotlightedStudio: f['Last Spotlighted Studio'] || '',
    lastSpotlightedProvider: f['Last Spotlighted Provider'] || '',
    lastContacted: f['Last Contacted'] || '',
    joinedDate: f['Joined Date'] || '',
    dateAdded: f['Date Added'] || record.createdTime || '',
    addedBy: f['Added By'] || 'Tiffany',
    updates: Array.isArray(shared.updates) ? shared.updates : [],
    tasks: Array.isArray(shared.tasks) ? shared.tasks : [],
  };
}

function contactFields(contact) {
  return {
    'Contact Name': contact.name,
    Instagram: contact.handle || '',
    Email: contact.email || '',
    Brand: contact.brand,
    'Contact Type': contact.type,
    'Offering Type': Array.isArray(contact.offering) ? contact.offering : [],
    Stage: contact.status,
    'Follow Up Date': contact.due || null,
    'Last Spotlighted Class': contact.lastSpotlightedClass || null,
    'Last Spotlighted Studio': contact.lastSpotlightedStudio || null,
    'Last Spotlighted Provider': contact.lastSpotlightedProvider || null,
    'Last Contacted': contact.lastContacted || null,
    'Joined Date': contact.joinedDate || null,
    Notes: contact.note || '',
    'Added By': contact.addedBy || 'Tiffany',
  };
}

function activitySnapshot(record) {
  const key = String(record.fields?.Activity || '').replace(/^Contact /, '');
  try { return [key, JSON.parse(record.fields?.Update || '{}')]; } catch { return [key, {}]; }
}

async function saveContactActivity(contact) {
  const activity = await list('activity');
  const key = `Contact ${contact.id}`;
  const existing = activity.find((record) => record.fields?.Activity === key);
  const fields = {
    Activity: key,
    Update: JSON.stringify({ updates: contact.updates || [], tasks: contact.tasks || [] }),
    'Activity Type': 'Contact Snapshot',
    Task: contact.name,
  };
  if (existing) return airtable('activity', `/${existing.id}`, { method: 'PATCH', body: JSON.stringify({ fields, typecast: true }) });
  return airtable('activity', '', { method: 'POST', body: JSON.stringify({ records: [{ fields }], typecast: true }) });
}

function taskFromRecord(record) {
  const f = record.fields || {};
  return {
    airtableId: record.id,
    name: f.Task || 'Untitled task',
    done: Boolean(f.Complete),
    priority: f.Priority || 'Normal',
    extra: f['Task Type'] === 'Extra',
    goal: f.Goal || undefined,
    progress: f.Progress || 0,
    brand: f.Brand || 'The Daily Session',
    weekOf: f['Week Of'] || '',
  };
}

function dedupeTasks(records) {
  const tasks = new Map();
  for (const record of records) {
    const task = taskFromRecord(record);
    const key = `${task.weekOf}|${task.brand}|${task.name.trim().toLowerCase()}`;
    const existing = tasks.get(key);
    tasks.set(key, existing ? {
      ...existing,
      done: existing.done || task.done,
      progress: Math.max(Number(existing.progress || 0), Number(task.progress || 0)),
    } : task);
  }
  return [...tasks.values()];
}

function taskFields(task) {
  return {
    Task: task.name,
    Status: task.done ? 'Completed' : 'Not Started',
    'Week Of': task.weekOf,
    'Task Type': task.extra ? 'Extra' : 'Standard',
    Brand: task.brand,
    Priority: task.priority || 'Normal',
    Locked: Boolean(task.locked),
    Complete: Boolean(task.done || (task.goal && Number(task.progress || 0) >= Number(task.goal))),
    Goal: task.goal || null,
    Progress: task.progress || 0,
  };
}

function hourFromRecord(record) {
  const f = record.fields || {};
  const brands = Array.isArray(f.Brand) ? f.Brand.join(' + ') : (f.Brand || '');
  return {
    airtableId: record.id,
    weekOf: f['Week Of'] || '',
    date: f.Date || '',
    hours: Number(f['Total Hours'] || 0),
    brands,
    notes: f['Shift Notes'] || '',
    paid: Boolean(f.Paid),
    loggedBy: String(f.Entry || '').split(' · ')[2] || '',
  };
}

function hourFields(hour) {
  const brand = hour.brands === 'Both' || hour.brands.includes('+')
    ? ['The Daily Session', 'The Healing Directory']
    : [hour.brands];
  return {
    Entry: `${hour.date} · ${Number(hour.hours)}h · ${hour.loggedBy || ''}`,
    'Week Of': hour.weekOf,
    Date: hour.date,
    'Total Hours': Number(hour.hours),
    Brand: brand.filter(Boolean),
    'Shift Notes': hour.notes || '',
    Paid: Boolean(hour.paid),
  };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  const session = verifySession(event);
  if (!session) return response(401, { error: 'Sign in required' });
  const resource = event.queryStringParameters?.resource;
  try {
    if (event.httpMethod === 'GET') {
      if (resource === 'all') {
        const [contacts, tasks, hours, activity] = await Promise.all([list('contacts'), list('tasks'), list('hours'), list('activity')]);
        const contactActivity = new Map(activity.map(activitySnapshot));
        return response(200, {
          contacts: contacts.filter((record) => String(record.fields?.['Contact Name'] || '').trim()).map((record) => contactFromRecord(record, contactActivity.get(record.id))),
          tasks: dedupeTasks(tasks),
          hours: hours.filter((record) => record.fields?.Date).map(hourFromRecord),
        });
      }
      if (resource === 'hours') return response(200, { hours: (await list('hours')).filter((record) => record.fields?.Date).map(hourFromRecord) });
    }

    const body = JSON.parse(event.body || '{}');
    if (resource === 'contacts' && event.httpMethod === 'POST') {
      const existing = await list('contacts');
      const normalizedName = String(body.name || '').trim().toLowerCase();
      const normalizedHandle = String(body.handle || '').replace(/^@/, '').trim().toLowerCase();
      const duplicate = existing.find((record) => {
        const fields = record.fields || {};
        const recordName = String(fields['Contact Name'] || '').trim().toLowerCase();
        const recordHandle = String(fields.Instagram || '').replace(/^@/, '').trim().toLowerCase();
        return recordName === normalizedName || (normalizedHandle && recordHandle === normalizedHandle);
      });
      if (duplicate) return response(409, { error: `${duplicate.fields?.['Contact Name'] || 'This contact'} already exists.` });
      const data = await airtable('contacts', '', { method: 'POST', body: JSON.stringify({ records: [{ fields: contactFields(body) }], typecast: true }) });
      return response(201, contactFromRecord(data.records[0]));
    }
    if (resource === 'contacts' && event.httpMethod === 'PATCH') {
      const data = await airtable('contacts', `/${body.id}`, { method: 'PATCH', body: JSON.stringify({ fields: contactFields(body), typecast: true }) });
      await saveContactActivity(body);
      return response(200, contactFromRecord(data, { updates: body.updates, tasks: body.tasks }));
    }
    if (resource === 'tasks' && event.httpMethod === 'PUT') {
      const existing = await list('tasks');
      const byKey = new Map(existing.map((record) => [`${record.fields?.['Week Of']}|${record.fields?.Brand}|${record.fields?.Task}`, record]));
      const saved = [];
      for (const task of body.tasks || []) {
        const match = task.airtableId ? existing.find((record) => record.id === task.airtableId) : byKey.get(`${task.weekOf}|${task.brand}|${task.name}`);
        if (session.member !== 'Tiffany' && !match) return response(403, { error: 'Only Tiffany can add tasks.' });
        const safeTask = session.member === 'Tiffany' || !match ? task : {
          ...taskFromRecord(match),
          done: Boolean(task.done),
          progress: Number(task.progress || 0),
        };
        if (match) {
          const data = await airtable('tasks', `/${match.id}`, { method: 'PATCH', body: JSON.stringify({ fields: taskFields(safeTask), typecast: true }) });
          saved.push(taskFromRecord(data));
        } else {
          const data = await airtable('tasks', '', { method: 'POST', body: JSON.stringify({ records: [{ fields: taskFields(safeTask) }], typecast: true }) });
          saved.push(taskFromRecord(data.records[0]));
        }
      }
      return response(200, { tasks: saved });
    }
    if (resource === 'hours' && event.httpMethod === 'POST') {
      const data = await airtable('hours', '', { method: 'POST', body: JSON.stringify({ records: [{ fields: hourFields(body) }], typecast: true }) });
      return response(201, hourFromRecord(data.records[0]));
    }
    if (resource === 'hours' && event.httpMethod === 'PATCH') {
      const data = await airtable('hours', `/${body.airtableId}`, { method: 'PATCH', body: JSON.stringify({ fields: hourFields(body), typecast: true }) });
      return response(200, hourFromRecord(data));
    }
    return response(404, { error: 'Unknown Airtable operation' });
  } catch (error) {
    console.error(error);
    return response(error.message?.includes('not configured') ? 503 : 500, { error: error.message || 'Airtable request failed' });
  }
}
