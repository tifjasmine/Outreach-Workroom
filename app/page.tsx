'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  AtSign as Instagram,
  Filter,
  GripVertical,
  LayoutDashboard,
  List,
  Mail,
  Plus,
  Search,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';

type Update = { text: string; date: string; by: string };
type ContactTask = { text: string; due: string; done: boolean };
type Lead = {
  id: number | string;
  name: string;
  handle: string;
  email?: string;
  brand: string;
  type: string;
  status: string;
  note: string;
  due?: string;
  addedBy: string;
  updates: Update[];
  tasks: ContactTask[];
};
const statuses = [
  'Contacted',
  'Follow Up',
  'Joined',
  'Archived / Not a Good Fit',
];
const seed: Lead[] = [
  {
    id: 1,
    name: 'Maha Yoga Studio',
    handle: '@mahayogaphilly',
    email: 'hello@mahayoga.com',
    brand: 'The Daily Session',
    type: 'Studio / Business',
    status: 'Follow Up',
    note: 'Asked for the media kit',
    due: 'Today',
    addedBy: 'Tiffany',
    updates: [
      {
        text: 'Sent the fall partnership overview.',
        date: 'Sep 2 · 4:30 PM',
        by: 'Assistant',
      },
    ],
    tasks: [{ text: 'Send the studio link', due: 'Today', done: false }],
  },
  {
    id: 2,
    name: 'Grounded Wellness',
    handle: '@groundedwellness',
    email: 'hello@grounded.co',
    brand: 'The Healing Directory',
    type: 'Provider',
    status: 'Contacted',
    note: 'Wants September details',
    addedBy: 'Assistant',
    updates: [],
    tasks: [],
  },
  {
    id: 3,
    name: 'Lumina Pilates',
    handle: '@luminapilates',
    brand: 'The Daily Session',
    type: 'Studio',
    status: 'Contacted',
    note: 'New Rittenhouse studio',
    addedBy: 'Assistant',
    updates: [],
    tasks: [],
  },
  {
    id: 4,
    name: 'Soft Space Ceramics',
    handle: '@softspacephl',
    brand: 'The Daily Session',
    type: 'Studio',
    status: 'Contacted',
    note: 'Sent directory invitation',
    addedBy: 'Tiffany',
    updates: [],
    tasks: [],
  },
  {
    id: 5,
    name: 'Nia Rivers',
    handle: '@niamoves',
    brand: 'The Healing Directory',
    type: 'Provider',
    status: 'Follow Up',
    note: 'Circle back after launch',
    due: '2026-09-08',
    addedBy: 'Assistant',
    updates: [],
    tasks: [{ text: 'First follow up', due: 'Sep 8', done: false }],
  },
  {
    id: 6,
    name: 'Root & Rise',
    handle: '@rootandrise',
    brand: 'The Healing Directory',
    type: 'Group Practice',
    status: 'Contacted',
    note: 'Application received',
    addedBy: 'Tiffany',
    updates: [],
    tasks: [],
  },
  {
    id: 7,
    name: 'Philadelphia Movement',
    handle: '@phillymovement',
    brand: 'The Daily Session',
    type: 'Studio / Business',
    status: 'Joined',
    note: 'Profile is live',
    addedBy: 'Assistant',
    updates: [],
    tasks: [],
  },
];
const nav = [
  'Overview',
  'Pipeline',
  'Contacts',
  'Follow ups',
  'Tasks',
  'Hours',
  'Settings',
];

async function airtableApi<T = Record<string, unknown>>(path: string, options?: RequestInit): Promise<T> {
  const requestHeaders = new Headers(options?.headers);
  requestHeaders.set('Content-Type', 'application/json');
  const response = await fetch(`/api/airtable${path}`, {
    ...options,
    headers: requestHeaders,
  });
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(data.error || 'Airtable is unavailable');
  return data;
}

export default function Home() {
  const [view, setView] = useState('Overview'),
    [leads, setLeads] = useState<Lead[]>(seed),
    [addOpen, setAddOpen] = useState(false),
    [selected, setSelected] = useState<number | string | null>(null),
    [ready, setReady] = useState(false),
    [airtableReady, setAirtableReady] = useState(false),
    [previousTasks, setPreviousTasks] = useState<WeeklyTask[]>([]);
  const contactSyncTimers = useRef(new Map<number | string, ReturnType<typeof setTimeout>>());
  const currentTaskKey = dateKey(sundayOf(new Date()));
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>(() => {
    try {
      const saved = localStorage.getItem(`outreach-tasks-v2-${currentTaskKey}`);
      return saved
        ? JSON.parse(saved).map((task: Partial<WeeklyTask>) => {
            const isProviderGoal = task.name?.includes('Healing Directory providers');
            const isStudioGoal = task.name?.includes('Daily Session studios');
            return {
              name: isProviderGoal
                ? 'Reach out to new Healing Directory providers'
                : isStudioGoal
                  ? 'Reach out to new Daily Session studios'
                  : task.name || 'Untitled task',
              done: Boolean(task.done),
              extra: task.extra,
              priority: isProviderGoal || isStudioGoal ? 'High' : task.priority || 'Normal',
              goal: isProviderGoal ? 15 : isStudioGoal ? 5 : task.goal,
              progress: task.progress || 0,
              brand: task.brand || (isProviderGoal ? 'The Healing Directory' : isStudioGoal ? 'The Daily Session' : 'The Daily Session'),
            };
          })
        : baselineTasks;
    } catch {
      return baselineTasks;
    }
  });
  useEffect(() => {
    let localContacts: Lead[] | null = null;
    try {
      const saved = localStorage.getItem('outreach-workroom-contacts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const stageMap: Record<string, string> = {
            'To Contact': 'Contacted',
            Messaged: 'Contacted',
            Replied: 'Follow Up',
            Interested: 'Follow Up',
            Applied: 'Contacted',
          };
          localContacts = parsed.map((contact: Lead) => ({
              ...contact,
              status: stageMap[contact.status] || contact.status,
            }));
          setLeads(localContacts);
        }
      }
    } catch {}
    airtableApi<{ contacts: Lead[]; tasks: WeeklyTask[]; hours: unknown[] }>('?resource=all')
      .then((data) => {
        if (Array.isArray(data.contacts)) setLeads(data.contacts);
        if (Array.isArray(data.tasks)) {
          const current = data.tasks.filter((task: WeeklyTask) => task.weekOf === currentTaskKey);
          const previous = data.tasks.filter((task: WeeklyTask) => task.weekOf && task.weekOf < currentTaskKey);
          setWeeklyTasks(current.length ? current : baselineTasks.map((task) => ({ ...task, weekOf: currentTaskKey })));
          setPreviousTasks(previous);
        }
        setAirtableReady(true);
      })
      .catch(() => {
        if (!localContacts) setLeads(seed);
      })
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem('outreach-workroom-contacts', JSON.stringify(leads));
  }, [leads, ready]);
  useEffect(() => {
    localStorage.setItem(
      `outreach-tasks-v2-${currentTaskKey}`,
      JSON.stringify(weeklyTasks),
    );
  }, [weeklyTasks, currentTaskKey]);
  useEffect(() => {
    if (!airtableReady) return;
    const timer = setTimeout(() => {
      airtableApi<{ tasks: WeeklyTask[] }>('?resource=tasks', {
        method: 'PUT',
        body: JSON.stringify({ tasks: weeklyTasks.map((task) => ({ ...task, weekOf: currentTaskKey })) }),
      }).then((data) => {
        if (!Array.isArray(data.tasks)) return;
        setWeeklyTasks((current) => JSON.stringify(current) === JSON.stringify(data.tasks) ? current : data.tasks);
      }).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [weeklyTasks, currentTaskKey, airtableReady]);
  const addLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const lead: Lead = {
      id: Date.now(),
      name: String(f.get('name')),
      handle: String(f.get('instagram') || ''),
      email: String(f.get('email') || ''),
      brand: String(f.get('brand')),
      type: String(f.get('type')),
      status: String(f.get('status')),
      due: String(f.get('due') || ''),
      note: String(f.get('note') || ''),
      addedBy: String(f.get('addedBy') || 'Tiffany'),
      updates: [],
      tasks: [],
    };
    setLeads([lead, ...leads]);
    setAddOpen(false);
    try {
      const saved = await airtableApi<Lead>('?resource=contacts', { method: 'POST', body: JSON.stringify(lead) });
      setLeads((current) => current.map((item) => item.id === lead.id ? saved : item));
    } catch {}
  };
  const changeLead = (next: Lead) => {
    setLeads(leads.map((x) => (x.id === next.id ? next : x)));
    if (typeof next.id !== 'string' || !next.id.startsWith('rec')) return;
    const existing = contactSyncTimers.current.get(next.id);
    if (existing) clearTimeout(existing);
    contactSyncTimers.current.set(next.id, setTimeout(() => {
      airtableApi('?resource=contacts', { method: 'PATCH', body: JSON.stringify(next) }).catch(() => {});
    }, 450));
  };
  const replaceLeads = (next: Lead[]) => {
    const changed = next.find((candidate) => {
      const before = leads.find((lead) => lead.id === candidate.id);
      return before && JSON.stringify(before) !== JSON.stringify(candidate);
    });
    setLeads(next);
    if (changed) changeLead(changed);
  };
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <button className="brand-mark" onClick={() => setView('Overview')} aria-label="Open home page">
          <span>O</span>
          <div>
            <strong>Outreach</strong>
            <small>WORKROOM</small>
          </div>
        </button>
        <button className="sidebar-add" onClick={() => setAddOpen(true)}>
          <Plus size={17} /> Add contact
        </button>
        <nav>
          {nav.map((item) => (
            <button
              onClick={() => setView(item)}
              className={view === item ? 'active' : ''}
              key={item}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Sparkles size={18} />
          <p>
            <strong>Everything in motion.</strong>
            <br />A calm home for the work.
          </p>
        </div>
        <div className="profile">
          <span>TW</span>
          <div>
            <strong>Tiffany</strong>
            <small>Workspace owner</small>
          </div>
        </div>
      </aside>
      <section className="workspace">
        {view === 'Overview' ? (
          <Dashboard
            leads={leads}
            tasks={weeklyTasks}
            open={setView}
            add={() => setAddOpen(true)}
          />
        ) : view === 'Contacts' ? (
          <Contacts
            leads={leads}
            open={setSelected}
            add={() => setAddOpen(true)}
          />
        ) : view === 'Tasks' ? (
          <Tasks tasks={weeklyTasks} setTasks={setWeeklyTasks} previousTasks={previousTasks} />
        ) : view === 'Hours' ? (
          <Hours />
        ) : view === 'Settings' ? (
          <Settings />
        ) : (
          <Outreach
            title={view}
            leads={leads}
            setLeads={replaceLeads}
            add={() => setAddOpen(true)}
            open={setSelected}
          />
        )}
      </section>
      {!['Tasks', 'Hours', 'Settings'].includes(view) && (
        <button className="floating-add" onClick={() => setAddOpen(true)}>
          <Plus size={20} />
          <span>Add contact</span>
        </button>
      )}
      {addOpen && <AddModal close={() => setAddOpen(false)} submit={addLead} />}{' '}
      {selected && (
        <ContactDetail
          lead={leads.find((x) => x.id === selected)!}
          change={changeLead}
          close={() => setSelected(null)}
        />
      )}
    </main>
  );
}
function Header({
  eyebrow,
  title,
  sub,
  action,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  action?: React.ReactNode;
}) {
  return (
    <header>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      {action}
    </header>
  );
}
function Dashboard({
  leads,
  tasks,
  open,
  add,
}: {
  leads: Lead[];
  tasks: WeeklyTask[];
  open: (v: string) => void;
  add: () => void;
}) {
  const count = (s: string) => leads.filter((x) => x.status === s).length;
  const [taskBrand, setTaskBrand] = useState<WeeklyTask['brand']>('The Daily Session');
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).toUpperCase();
  const completedTasks = tasks.filter((task) => task.done || (task.goal && (task.progress || 0) >= task.goal)).length;
  const remainingTasks = tasks.length - completedTasks;
  const brandTasks = tasks.filter((task) => task.brand === taskBrand);
  return (
    <>
      <Header
        eyebrow={todayLabel.replace(', ', ' · ')}
        title="Tiffany & Xachil"
        sub="Contacts, weekly outreach, and follow ups."
        action={
          <button className="primary add-prominent" onClick={add}>
            <Plus size={17} /> Add contact
          </button>
        }
      />
      <div className="status-strip">
        {[
          ['Contacted', count('Contacted')],
          ['Follow up', count('Follow Up')],
          ['Joined', count('Joined')],
          ['Archived', count('Archived / Not a Good Fit')],
        ].map(([label, value]) => (
          <button
            key={label}
            onClick={() =>
              open(label === 'Follow up' ? 'Follow ups' : 'Pipeline')
            }
          >
            <span>{value}</span>
            <small>{label}</small>
            <ArrowUpRight size={14} />
          </button>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="priority-card dark">
          <div className="card-head">
            <div>
              <p className="eyebrow coral">FOLLOW UPS</p>
              <h2>{count('Follow Up')} waiting</h2>
            </div>
            <span>{count('Follow Up')} open</span>
          </div>
          <div className="focus-row">
            <div>
              <strong>{count('Follow Up')}</strong>
              <small>Follow ups waiting</small>
            </div>
            <button onClick={() => open('Follow ups')}>
              Start follow ups <ArrowUpRight size={16} />
            </button>
          </div>
        </section>
        <section className="week-card">
          <div className="card-head">
            <div>
              <p className="eyebrow">THIS WEEK</p>
              <h2>{remainingTasks} tasks remaining</h2>
            </div>
            <span className="week-count">{completedTasks}/{tasks.length} done</span>
          </div>
          <div className="dashboard-task-tabs" aria-label="Choose task brand">
            <button className={taskBrand === 'The Daily Session' ? 'active' : ''} onClick={() => setTaskBrand('The Daily Session')}>The Daily</button>
            <button className={taskBrand === 'The Healing Directory' ? 'active' : ''} onClick={() => setTaskBrand('The Healing Directory')}>Directory</button>
          </div>
          {brandTasks.map((task) => (
            <div className="task" key={task.name}>
              <i className={task.priority === 'High' ? 'high' : ''} />
              <div>
                <strong>{task.name}</strong>
                <small>{task.goal ? `${task.progress || 0}/${task.goal} reached` : task.done ? 'Completed' : 'Open'}</small>
              </div>
            </div>
          ))}
          <button className="text-link" onClick={() => open('Tasks')}>
            View all tasks →
          </button>
        </section>
        <Brand
          initials="DS"
          label="THE DAILY SESSION"
          title="Studio outreach"
          leads={leads.filter((x) => x.brand === 'The Daily Session')}
          open={() => open('Pipeline')}
        />
        <Brand
          initials="HD"
          label="THE HEALING DIRECTORY"
          title="Provider outreach"
          leads={leads.filter((x) => x.brand === 'The Healing Directory')}
          accent
          open={() => open('Pipeline')}
        />
      </div>
    </>
  );
}
function Brand({
  initials,
  label,
  title,
  leads,
  accent = false,
  open,
}: {
  initials: string;
  label: string;
  title: string;
  leads: Lead[];
  accent?: boolean;
  open: () => void;
}) {
  return (
    <section className={`brand-card ${accent ? 'accent' : ''}`}>
      <div className="brand-icon">{initials}</div>
      <p className="eyebrow">{label}</p>
      <h2>{title}</h2>
      <div className="brand-metrics">
        <div>
          <strong>{leads.length}</strong>
          <small>Contacts</small>
        </div>
        <div>
          <strong>
            {leads.filter((x) => x.status === 'Contacted').length}
          </strong>
          <small>Contacted</small>
        </div>
        <div>
          <strong>
            {leads.filter((x) => x.status === 'Follow Up').length}
          </strong>
          <small>Due</small>
        </div>
      </div>
      <button onClick={open}>
        Open pipeline <ArrowUpRight size={15} />
      </button>
    </section>
  );
}

function Outreach({
  title,
  leads,
  setLeads,
  add,
  open,
}: {
  title: string;
  leads: Lead[];
  setLeads: (x: Lead[]) => void;
  add: () => void;
  open: (id: number | string) => void;
}) {
  const [mode, setMode] = useState('Pipeline'),
    [brand, setBrand] = useState('All'),
    [stageFilter, setStageFilter] = useState('All'),
    [mobileStage, setMobileStage] = useState(statuses[0]),
    [search, setSearch] = useState(''),
    [filtersOpen, setFiltersOpen] = useState(false);
  const filtered = leads.filter(
    (x) =>
      (brand === 'All' || x.brand === brand) &&
      (stageFilter === 'All' || x.status === stageFilter) &&
      (title !== 'Follow ups' || x.status === 'Follow Up') &&
      `${x.name} ${x.handle} ${x.email}`.toLowerCase().includes(search.toLowerCase()),
  );
  const move = (id: number | string, status: string) =>
    setLeads(leads.map((x) => (String(x.id) === String(id) ? { ...x, status } : x)));
  return (
    <>
      <Header
        eyebrow={title === 'Follow ups' ? 'DUE & OVERDUE' : 'OUTREACH'}
        title={title === 'Follow ups' ? 'Follow ups' : 'Outreach pipeline'}
        sub="The full path from first find to joined—without sales clutter."
        action={
          <button className="primary add-prominent" onClick={add}>
            <Plus size={17} /> Add contact
          </button>
        }
      />
      <div className="toolbar">
        <label>
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts…" />
        </label>
        <select value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option>All</option>
          <option>The Daily Session</option>
          <option>The Healing Directory</option>
        </select>
        <button className={filtersOpen ? 'selected' : ''} onClick={() => setFiltersOpen(!filtersOpen)}>
          <Filter size={15} /> Filter
        </button>
        <div className="segmented">
          <button
            className={mode === 'Pipeline' ? 'selected' : ''}
            onClick={() => setMode('Pipeline')}
          >
            <LayoutDashboard size={14} /> Pipeline
          </button>
          <button
            className={mode === 'Table' ? 'selected' : ''}
            onClick={() => setMode('Table')}
          >
            <List size={14} /> List
          </button>
        </div>
      </div>
      {filtersOpen && (
        <div className="filter-bar">
          <label>
            Stage
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
              <option>All</option>
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <span>{filtered.length} matching contacts</span>
          <button onClick={() => { setStageFilter('All'); setBrand('All'); setSearch(''); }}>Clear filters</button>
        </div>
      )}
      {mode === 'Pipeline' ? (
        <>
        <div className="mobile-stage-tabs" aria-label="Choose pipeline stage">
          {statuses.map((status) => (
            <button
              key={status}
              className={mobileStage === status ? 'active' : ''}
              onClick={() => setMobileStage(status)}
            >
              <span>{status === 'Archived / Not a Good Fit' ? 'Archived' : status}</span>
              <b>{filtered.filter((x) => x.status === status).length}</b>
            </button>
          ))}
        </div>
        <div className="pipeline">
          {statuses.map((status) => (
            <section
              className={`column ${mobileStage === status ? 'mobile-active' : ''}`}
              key={status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => move(e.dataTransfer.getData('id'), status)}
            >
              <div className="column-head">
                <strong>{status}</strong>
                <span>
                  {filtered.filter((x) => x.status === status).length}
                </span>
                <button onClick={add}>
                  <Plus size={15} />
                </button>
              </div>
              {filtered
                .filter((x) => x.status === status)
                .map((lead) => (
                  <article
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData('id', String(lead.id))
                    }
                    onClick={() => open(lead.id)}
                    className="lead-card"
                    key={lead.id}
                  >
                    <GripVertical size={14} />
                    <strong>{lead.name}</strong>
                    <small>{lead.handle || lead.email}</small>
                    {lead.due && (
                      <em className={lead.due === 'Today' ? 'overdue' : ''}>
                        Follow up: {lead.due}
                      </em>
                    )}
                    <p>“{lead.note}”</p>
                  </article>
                ))}
            </section>
          ))}
        </div>
        </>
      ) : (
        <ContactTable leads={filtered} open={open} move={move} />
      )}
    </>
  );
}
function Contacts({
  leads,
  open,
  add,
}: {
  leads: Lead[];
  open: (id: number | string) => void;
  add: () => void;
}) {
  const [q, setQ] = useState(''),
    [brand, setBrand] = useState('All');
  const shown = useMemo(
    () =>
      leads.filter(
        (x) =>
          (brand === 'All' || x.brand === brand) &&
          `${x.name} ${x.handle} ${x.email}`
            .toLowerCase()
            .includes(q.toLowerCase()),
      ),
    [leads, q, brand],
  );
  return (
    <>
      <Header
        eyebrow="PEOPLE & PLACES"
        title="Contacts"
        sub="Every studio, provider, creator, and partner in one clean home."
        action={
          <button className="primary add-prominent" onClick={add}>
            <Plus size={17} /> Add contact
          </button>
        }
      />
      <div className="contact-toolbar">
        <label>
          <Search size={17} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, Instagram, or email…"
          />
        </label>
        <select value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option>All</option>
          <option>The Daily Session</option>
          <option>The Healing Directory</option>
        </select>
        <span>{shown.length} contacts</span>
      </div>
      <div className="contact-list">
        <div className="contact-list-head">
          <span>Contact</span>
          <span>Brand</span>
          <span>Stage</span>
          <span>Follow up</span>
          <span>Added by</span>
        </div>
        {shown.map((x) => (
          <button
            className="contact-list-row"
            key={x.id}
            onClick={() => open(x.id)}
          >
            <span className="contact-person">
              <i>{x.name.slice(0, 2).toUpperCase()}</i>
              <span>
                <strong>{x.name}</strong>
                <small>{x.handle || x.email}</small>
              </span>
            </span>
            <span>
              <b
                className={`brand-pill ${x.brand.includes('Healing') ? 'thd' : ''}`}
              >
                {x.brand.includes('Healing') ? 'THD' : 'TDS'}
              </b>
            </span>
            <span>
              <b className="stage-pill">{x.status}</b>
            </span>
            <span>{x.due || '—'}</span>
            <span>{x.addedBy}</span>
          </button>
        ))}
      </div>
    </>
  );
}
function ContactTable({
  leads,
  open,
  move,
}: {
  leads: Lead[];
  open: (id: number | string) => void;
  move: (id: number | string, s: string) => void;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {[
              'Contact',
              'Instagram / Email',
              'Brand',
              'Stage',
              'Follow Up',
              'Added By',
            ].map((x) => (
              <th key={x}>{x}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((x) => (
            <tr key={x.id} onClick={() => open(x.id)}>
              <td data-label="Contact">
                <strong>{x.name}</strong>
              </td>
              <td data-label="Instagram / Email">{x.handle || x.email}</td>
              <td data-label="Brand">{x.brand}</td>
              <td data-label="Stage">
                <select
                  value={x.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => move(x.id, e.target.value)}
                >
                  {statuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td data-label="Follow Up">{x.due || '—'}</td>
              <td data-label="Added By">{x.addedBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContactDetail({
  lead,
  change,
  close,
}: {
  lead: Lead;
  change: (x: Lead) => void;
  close: () => void;
}) {
  const [update, setUpdate] = useState(''),
    [task, setTask] = useState('');
  const addUpdate = () => {
    if (!update.trim()) return;
    change({
      ...lead,
      updates: [
        { text: update, date: 'Just now', by: 'Tiffany' },
        ...lead.updates,
      ],
    });
    setUpdate('');
  };
  const addTask = () => {
    if (!task.trim()) return;
    change({
      ...lead,
      tasks: [...lead.tasks, { text: task, due: 'Tomorrow', done: false }],
    });
    setTask('');
  };
  return (
    <div className="detail-backdrop" onMouseDown={close}>
      <section
        className="contact-detail"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="detail-title">
          <div>
            <span>{lead.name.slice(0, 2).toUpperCase()}</span>
            <div>
              <h2>{lead.name}</h2>
              <p>
                {lead.brand} · {lead.type}
              </p>
            </div>
          </div>
          <button onClick={close}>
            <X />
          </button>
        </header>
        <div className="detail-body">
          <main>
            <div className="detail-fields">
              <label>
                Instagram
                <div>
                  <Instagram size={16} />
                  <input
                    value={lead.handle}
                    onChange={(e) =>
                      change({ ...lead, handle: e.target.value })
                    }
                  />
                </div>
              </label>
              <label>
                Email
                <div>
                  <Mail size={16} />
                  <input
                    value={lead.email || ''}
                    onChange={(e) => change({ ...lead, email: e.target.value })}
                  />
                </div>
              </label>
              <label>
                Stage
                <select
                  value={lead.status}
                  onChange={(e) => change({ ...lead, status: e.target.value })}
                >
                  {statuses.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Follow-up date
                <input
                  value={lead.due || ''}
                  onChange={(e) => change({ ...lead, due: e.target.value })}
                  placeholder="Sep 8"
                />
              </label>
            </div>
            <div className="detail-section">
              <div className="detail-section-title">
                <h3>Open tasks ({lead.tasks.filter((x) => !x.done).length})</h3>
              </div>
              <div className="inline-create">
                <input
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  placeholder="Add a follow-up task…"
                />
                <button onClick={addTask}>Add task</button>
              </div>
              {lead.tasks.map((t, i) => (
                <button
                  className={`contact-task ${t.done ? 'done' : ''}`}
                  key={i}
                  onClick={() =>
                    change({
                      ...lead,
                      tasks: lead.tasks.map((x, j) =>
                        j === i ? { ...x, done: !x.done } : x,
                      ),
                    })
                  }
                >
                  <i>{t.done ? '✓' : ''}</i>
                  <span>
                    <strong>{t.text}</strong>
                    <small>Due: {t.due}</small>
                  </span>
                </button>
              ))}
            </div>
            <div className="detail-section">
              <h3>Activity</h3>
              <article className="activity-card">
                <p>Contact added by {lead.addedBy}</p>
                {lead.updates.map((u, i) => (
                  <div key={i}>
                    <strong>{u.by}</strong> added an update · {u.date}
                    <p>{u.text}</p>
                  </div>
                ))}
              </article>
            </div>
          </main>
          <aside className="updates">
            <div className="update-intro">
              <UserRound />
              <h3>Leave an update</h3>
              <p>
                Share notes, progress, and keep everyone aligned on this
                contact.
              </p>
            </div>
            <div className="update-compose">
              <textarea
                value={update}
                onChange={(e) => setUpdate(e.target.value)}
                placeholder="Leave an update…"
              />
              <button onClick={addUpdate}>Post update</button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function sundayOf(date: Date) {
  const sunday = new Date(date);
  sunday.setHours(0, 0, 0, 0);
  sunday.setDate(sunday.getDate() - sunday.getDay());
  return sunday;
}
function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
function prettyDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
type TaskPriority = 'High' | 'Normal' | 'Low';
type WeeklyTask = {
  airtableId?: string;
  name: string;
  done: boolean;
  priority: TaskPriority;
  extra?: boolean;
  goal?: number;
  progress?: number;
  brand: 'The Daily Session' | 'The Healing Directory';
  weekOf?: string;
  locked?: boolean;
};
const baselineTasks: WeeklyTask[] = [
  { name: 'Reach out to new partners', brand: 'The Healing Directory', done: false, priority: 'High', goal: 15, progress: 0 },
  { name: 'Reach out to new partners', brand: 'The Daily Session', done: false, priority: 'High', goal: 5, progress: 0 },
  { name: 'Create content', brand: 'The Healing Directory', done: false, priority: 'Normal' },
  { name: 'Create content', brand: 'The Daily Session', done: false, priority: 'Normal' },
  { name: 'Reshare relevant stories and posts', brand: 'The Healing Directory', done: false, priority: 'Low' },
  { name: 'Reshare relevant stories and posts', brand: 'The Daily Session', done: false, priority: 'Low' },
];
function Tasks({ tasks, setTasks, previousTasks }: { tasks: WeeklyTask[]; setTasks: (tasks: WeeklyTask[]) => void; previousTasks: WeeklyTask[] }) {
  const currentSunday = sundayOf(new Date());
  const previousSunday = new Date(currentSunday);
  previousSunday.setDate(previousSunday.getDate() - 7);
  const previousKey = dateKey(previousSunday);
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('Normal');
  const [brandFilter, setBrandFilter] = useState<WeeklyTask['brand']>('The Daily Session');
  const [priorityFilter, setPriorityFilter] = useState<'All' | TaskPriority>('All');
  const savedPreviousTasks = previousTasks.filter((task) => task.weekOf === previousKey);
  const add = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { name: newTask.trim(), brand: brandFilter, done: false, priority: newPriority, extra: true }]);
    setNewTask('');
  };
  const isComplete = (task: WeeklyTask) => task.done || Boolean(task.goal && (task.progress || 0) >= task.goal);
  const updateTask = (index: number, changes: Partial<WeeklyTask>) =>
    setTasks(tasks.map((task, taskIndex) => taskIndex === index ? { ...task, ...changes } : task));
  const brandTasks = tasks.filter((task) => task.brand === brandFilter);
  const completed = brandTasks.filter(isComplete).length;
  const visibleTasks = priorityFilter === 'All' ? brandTasks : brandTasks.filter((task) => task.priority === priorityFilter);
  return (
    <>
      <Header
        eyebrow={`SUNDAY–SATURDAY · WEEK OF ${prettyDate(currentSunday).toUpperCase()}`}
        title="This week’s checklist"
        sub="Check off each task as it’s completed. Add extras whenever they come up."
        action={
          <button
            className="primary"
            onClick={() => document.getElementById('new-week-task')?.focus()}
          >
            + Add weekly task
          </button>
        }
      />
      <div className="brand-task-toggle" aria-label="Choose task brand">
        <button className={brandFilter === 'The Daily Session' ? 'active' : ''} onClick={() => setBrandFilter('The Daily Session')}>Daily Session</button>
        <button className={brandFilter === 'The Healing Directory' ? 'active' : ''} onClick={() => setBrandFilter('The Healing Directory')}>Healing Directory</button>
      </div>
      <div className="task-filter-row" aria-label="Filter tasks by priority">
        {(['All', 'High', 'Normal', 'Low'] as const).map((priority) => (
          <button className={priorityFilter === priority ? 'active' : ''} onClick={() => setPriorityFilter(priority)} key={priority}>
            {priority}{priority !== 'All' ? ' priority' : ''}
          </button>
        ))}
      </div>
      <section className="task-panel current-week-panel tasks-only">
          <div className="section-title">
            <div>
              <p className="eyebrow coral">CURRENT WEEK · ENDS SATURDAY</p>
              <h2>
                {completed} of {brandTasks.length} completed
              </h2>
            </div>
            <span>{brandTasks.length ? Math.round((completed / brandTasks.length) * 100) : 0}%</span>
          </div>
          <div className="task-progress">
            <i style={{ width: `${brandTasks.length ? (completed / brandTasks.length) * 100 : 0}%` }} />
          </div>
          <div className="quick-add">
            <input
              id="new-week-task"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add something extra for this week…"
              onKeyDown={(e) => e.key === 'Enter' && add()}
            />
            <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as TaskPriority)} aria-label="New task priority">
              <option>High</option>
              <option>Normal</option>
              <option>Low</option>
            </select>
            <button onClick={add}>Add to this week</button>
          </div>
          {visibleTasks.map((t) => {
            const i = tasks.indexOf(t);
            const done = isComplete(t);
            return (
            <div
              className={`task-row ${done ? 'done' : ''}`}
              key={t.name}
            >
              <button className="task-check" aria-label={`Mark ${t.name} ${done ? 'incomplete' : 'complete'}`} onClick={() => updateTask(i, t.goal ? { done: false, progress: done ? 0 : t.goal } : { done: !done })}>
                {done ? '✓' : ''}
              </button>
              <div>
                <strong>{t.name}</strong>
                <small>
                  {t.goal ? `${t.progress || 0} of ${t.goal} reached` : t.extra ? 'Added this week' : 'Weekly task'}
                </small>
              </div>
              {t.goal && (
                <div className="goal-stepper">
                  <button aria-label={`Remove one from ${t.name}`} onClick={() => updateTask(i, { progress: Math.max(0, (t.progress || 0) - 1), done: false })}>−</button>
                  <strong>{t.progress || 0}/{t.goal}</strong>
                  <button aria-label={`Add one to ${t.name}`} onClick={() => updateTask(i, { progress: Math.min(t.goal || 0, (t.progress || 0) + 1) })}>+</button>
                </div>
              )}
              <select className="task-priority-select" value={t.priority} onChange={(event) => updateTask(i, { priority: event.target.value as TaskPriority })} aria-label={`Priority for ${t.name}`}>
                <option>High</option>
                <option>Normal</option>
                <option>Low</option>
              </select>
            </div>
            );
          })}
      </section>
      <section className="week-history">
        <p className="eyebrow">PAST WEEKS</p>
        <details>
          <summary>
            <span>
              <strong>Week of {prettyDate(previousSunday)}</strong>
              <small>{savedPreviousTasks.filter((task) => task.done || (task.goal && (task.progress || 0) >= task.goal)).length} completed · Locked</small>
            </span>
            <b>View work</b>
          </summary>
          {savedPreviousTasks.length ? savedPreviousTasks.map((task) => (
            <div className="locked-task" key={task.name}>
              <span>{task.done || (task.goal && (task.progress || 0) >= task.goal) ? '✓' : '·'}</span>
              <div>{task.name}<small>{task.brand}{task.goal ? ` · ${task.progress || 0}/${task.goal}` : ''}</small></div>
              <small>Locked</small>
            </div>
          )) : <div className="locked-task"><span>·</span><div>No saved work for this week</div><small>Locked</small></div>}
        </details>
      </section>
    </>
  );
}
function Hours() {
  type HourLog = {
    airtableId?: string;
    weekOf: string;
    date: string;
    hours: number;
    brands: string;
    notes: string;
    paid: boolean;
  };
  const [showForm, setShowForm] = useState(false);
  const [logs, setLogs] = useState<HourLog[]>(() => {
    try {
      return (
        JSON.parse(localStorage.getItem('outreach-hours') || 'null') || [
          {
            weekOf: dateKey(sundayOf(new Date())),
            date: '2026-09-02',
            hours: 1,
            brands: 'The Daily Session + The Healing Directory',
            notes: 'Interview',
            paid: true,
          },
        ]
      );
    } catch {
      return [];
    }
  });
  useEffect(
    () => localStorage.setItem('outreach-hours', JSON.stringify(logs)),
    [logs],
  );
  useEffect(() => {
    airtableApi<{ hours: HourLog[] }>('?resource=hours')
      .then((data) => Array.isArray(data.hours) && setLogs(data.hours))
      .catch(() => {});
  }, []);
  const total = logs.reduce((sum, log) => sum + Number(log.hours), 0);
  const addHours = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const date = new Date(String(form.get('date')) + 'T12:00:00');
    const entry: HourLog = {
        weekOf: dateKey(sundayOf(date)),
        date: String(form.get('date')),
        hours: Number(form.get('hours')),
        brands: String(form.get('brand')),
        notes: String(form.get('notes')),
        paid: false,
      };
    setLogs([entry, ...logs]);
    setShowForm(false);
    try {
      const saved = await airtableApi<HourLog>('?resource=hours', { method: 'POST', body: JSON.stringify(entry) });
      setLogs((current) => current.map((item) => item === entry ? saved : item));
    } catch {}
  };
  const togglePaid = (index: number) => {
    const next = { ...logs[index], paid: !logs[index].paid };
    setLogs(logs.map((log, i) => i === index ? next : log));
    if (next.airtableId) airtableApi('?resource=hours', { method: 'PATCH', body: JSON.stringify(next) }).catch(() => {});
  };
  return (
    <>
      <Header
        eyebrow="TIME & ACTIVITY"
        title="Hours"
        sub="A simple record of focused work across both brands."
        action={
          <button className="primary" onClick={() => setShowForm(!showForm)}>
            + Add hours
          </button>
        }
      />
      {showForm && (
        <form className="hours-form" onSubmit={addHours}>
          <label>
            Date
            <input
              required
              name="date"
              type="date"
              defaultValue={dateKey(new Date())}
            />
          </label>
          <label>
            Total hours
            <input
              required
              name="hours"
              type="number"
              min="0.25"
              step="0.25"
              placeholder="1.5"
            />
          </label>
          <label>
            Brand
            <select name="brand">
              <option>The Daily Session</option>
              <option>The Healing Directory</option>
              <option>Both</option>
            </select>
          </label>
          <label>
            Shift notes
            <input name="notes" placeholder="What was worked on?" />
          </label>
          <button className="primary">Save hours</button>
        </form>
      )}
      <div className="hours-summary">
        <div>
          <small>THIS WEEK</small>
          <strong>{total.toFixed(2)}h</strong>
        </div>
        <div>
          <small>THE DAILY SESSION</small>
          <strong>
            {logs
              .filter((x) => x.brands.includes('Daily') || x.brands === 'Both')
              .reduce((s, x) => s + x.hours, 0)
              .toFixed(2)}
            h
          </strong>
        </div>
        <div>
          <small>HEALING DIRECTORY</small>
          <strong>
            {logs
              .filter(
                (x) => x.brands.includes('Healing') || x.brands === 'Both',
              )
              .reduce((s, x) => s + x.hours, 0)
              .toFixed(2)}
            h
          </strong>
        </div>
      </div>
      <section className="log-card">
        <div className="section-title">
          <div>
            <p className="eyebrow">RECENT ACTIVITY</p>
            <h2>Time log</h2>
          </div>
          <button onClick={() => setShowForm(!showForm)}>+ Add hours</button>
        </div>
        <div className="hours-table-head">
          <span>Week Of</span>
          <span>Date</span>
          <span>Total Hours</span>
          <span>Brand</span>
          <span>Shift Notes</span>
          <span>Paid</span>
        </div>
        {logs.map((x, index) => (
          <div className="hours-table-row" key={`${x.date}-${index}`}>
            <span>{x.weekOf}</span>
            <span>{x.date}</span>
            <strong>{x.hours}</strong>
            <span>{x.brands}</span>
            <span>{x.notes || '—'}</span>
            <label>
              <input
                type="checkbox"
                checked={x.paid}
                onChange={() => togglePaid(index)}
              />
            </label>
          </div>
        ))}
      </section>
    </>
  );
}
function Settings() {
  return (
    <>
      <Header
        eyebrow="WORKSPACE"
        title="Settings"
        sub="The little rules that keep the workroom running itself."
      />
      <div className="settings-card">
        <div>
          <h3>Automatically create standard weekly tasks</h3>
          <p>
            Start every Monday with the baseline assistant responsibilities
            already assigned.
          </p>
        </div>
        <button className="switch on">
          <i />
        </button>
      </div>
      <div className="settings-card">
        <div>
          <h3>Weekly task template</h3>
          <p>
            TDS outreach, THD outreach, follow ups, engagement, and new prospect
            research.
          </p>
        </div>
        <button>Edit template</button>
      </div>
      <div className="settings-card">
        <div>
          <h3>Team</h3>
          <p>Tiffany · Owner &nbsp;&nbsp; Xachil · Collaborator</p>
        </div>
        <button>Manage</button>
      </div>
    </>
  );
}
function AddModal({
  close,
  submit,
}: {
  close: () => void;
  submit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [brand, setBrand] = useState('The Daily Session');
  const contactTypes =
    brand === 'The Daily Session'
      ? ['Studio', 'Independent Instructor']
      : ['Provider', 'Group Practice'];
  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <form
        className="modal quick-contact"
        onSubmit={submit}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-x" onClick={close}>
          <X size={18} />
        </button>
        <p className="eyebrow">NEW CONTACT</p>
        <h2>Add contact</h2>
        <label>
          Contact or account name
          <input
            name="name"
            required
            autoFocus
            placeholder="Maha Yoga Studio"
          />
        </label>
        <div className="form-grid">
          <label>
            Instagram
            <input name="instagram" placeholder="@handle" />
          </label>
          <label>
            Email
            <input name="email" type="email" placeholder="hello@studio.com" />
          </label>
          <label>
            Brand
            <select
              name="brand"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
            >
              <option>The Daily Session</option>
              <option>The Healing Directory</option>
            </select>
          </label>
          <label>
            Type
            <select name="type" key={brand}>
              {contactTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            Stage
            <select name="status">
              {statuses.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Follow-up date
            <input name="due" type="date" />
          </label>
          <label>
            Added by
            <select name="addedBy" defaultValue="Tiffany">
              <option>Tiffany</option>
              <option>Xachil</option>
            </select>
          </label>
        </div>
        <label>
          Quick note
          <textarea
            name="note"
            placeholder="Anything helpful for the next touchpoint…"
          />
        </label>
        <button className="primary" type="submit">
          <Plus size={17} /> Add contact
        </button>
      </form>
    </div>
  );
}
