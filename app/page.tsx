'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  AtSign as Instagram,
  CalendarDays,
  CheckCircle2,
  Clock3,
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
  id: number;
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

export default function Home() {
  const [view, setView] = useState('Overview'),
    [leads, setLeads] = useState<Lead[]>(seed),
    [addOpen, setAddOpen] = useState(false),
    [selected, setSelected] = useState<number | null>(null),
    [ready, setReady] = useState(false);
  const [tasks, setTasks] = useState([
    {
      name: 'Follow up with THD applicants',
      meta: 'High priority · Due today',
      done: false,
    },
    {
      name: 'Reach out to 15 TDS studios',
      meta: 'Normal · 9 of 15 complete',
      done: false,
    },
    {
      name: 'Research five Philly events',
      meta: 'Normal · Due Friday',
      done: true,
    },
  ]);
  useEffect(() => {
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
          setLeads(
            parsed.map((contact: Lead) => ({
              ...contact,
              status: stageMap[contact.status] || contact.status,
            })),
          );
        }
      }
    } catch {
    } finally {
      setReady(true);
    }
  }, []);
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem('outreach-workroom-contacts', JSON.stringify(leads));
  }, [leads, ready]);
  const addLead = (e: React.FormEvent<HTMLFormElement>) => {
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
  };
  const changeLead = (next: Lead) =>
    setLeads(leads.map((x) => (x.id === next.id ? next : x)));
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">
          <span>O</span>
          <div>
            <strong>Outreach</strong>
            <small>WORKROOM</small>
          </div>
        </div>
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
          <Tasks />
        ) : view === 'Hours' ? (
          <Hours />
        ) : view === 'Settings' ? (
          <Settings />
        ) : (
          <Outreach
            title={view}
            leads={leads}
            setLeads={setLeads}
            add={() => setAddOpen(true)}
            open={setSelected}
          />
        )}
      </section>
      <button className="floating-add" onClick={() => setAddOpen(true)}>
        <Plus size={20} />
        <span>Add contact</span>
      </button>
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
  open,
  add,
}: {
  leads: Lead[];
  open: (v: string) => void;
  add: () => void;
}) {
  const count = (s: string) => leads.filter((x) => x.status === s).length;
  return (
    <>
      <Header
        eyebrow="THURSDAY · SEPTEMBER 3"
        title="Good evening, Tiffany."
        sub="Here’s what’s moving across both brands."
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
              <p className="eyebrow coral">TODAY’S FOCUS</p>
              <h2>Keep the warm leads warm.</h2>
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
          <div className="focus-meta">
            <span>
              <Clock3 size={15} /> Nothing gets lost
            </span>
            <span>
              <CalendarDays size={15} /> One shared queue
            </span>
          </div>
        </section>
        <section className="week-card">
          <div className="card-head">
            <div>
              <p className="eyebrow">THIS WEEK</p>
              <h2>4 tasks remaining</h2>
            </div>
            <span className="progress">3 of 7</span>
          </div>
          <div className="task">
            <i className="high" />
            <div>
              <strong>Follow up with THD applicants</strong>
              <small>High priority · Due today</small>
            </div>
          </div>
          <div className="task">
            <i />
            <div>
              <strong>Reach out to 15 TDS studios</strong>
              <small>Normal · 9 of 15 complete</small>
            </div>
          </div>
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
        <section className="anytime">
          <div>
            <CheckCircle2 size={20} />
            <div>
              <p className="eyebrow">EXTRA TIME?</p>
              <h3>There’s always something useful to pick up.</h3>
            </div>
          </div>
          <button onClick={() => open('Tasks')}>Browse anytime tasks →</button>
        </section>
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
  open: (id: number) => void;
}) {
  const [mode, setMode] = useState('Pipeline'),
    [brand, setBrand] = useState('All');
  const filtered = leads.filter(
    (x) =>
      (brand === 'All' || x.brand === brand) &&
      (title !== 'Follow ups' || x.status === 'Follow Up'),
  );
  const move = (id: number, status: string) =>
    setLeads(leads.map((x) => (x.id === id ? { ...x, status } : x)));
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
          <input placeholder="Search contacts…" />
        </label>
        <select value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option>All</option>
          <option>The Daily Session</option>
          <option>The Healing Directory</option>
        </select>
        <button>
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
      {mode === 'Pipeline' ? (
        <div className="pipeline">
          {statuses.map((status) => (
            <section
              className="column"
              key={status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => move(Number(e.dataTransfer.getData('id')), status)}
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
  open: (id: number) => void;
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
  open: (id: number) => void;
  move: (id: number, s: string) => void;
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
              <td>
                <strong>{x.name}</strong>
              </td>
              <td>{x.handle || x.email}</td>
              <td>{x.brand}</td>
              <td>
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
              <td>{x.due || '—'}</td>
              <td>{x.addedBy}</td>
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
type WeeklyTask = { name: string; done: boolean; extra?: boolean };
const baselineTasks: WeeklyTask[] = [
  { name: 'Find The Healing Directory providers', done: false },
  { name: 'Find The Daily Session studios', done: false },
  { name: 'Create content', done: false },
  { name: 'Engage with new applicants', done: false },
];
function Tasks() {
  const currentSunday = sundayOf(new Date());
  const currentKey = dateKey(currentSunday);
  const previousSunday = new Date(currentSunday);
  previousSunday.setDate(previousSunday.getDate() - 7);
  const [newTask, setNewTask] = useState('');
  const [tasks, setTasks] = useState<WeeklyTask[]>(() => {
    try {
      const saved = localStorage.getItem(`outreach-tasks-${currentKey}`);
      return saved ? JSON.parse(saved) : baselineTasks;
    } catch {
      return baselineTasks;
    }
  });
  useEffect(() => {
    localStorage.setItem(`outreach-tasks-${currentKey}`, JSON.stringify(tasks));
  }, [tasks, currentKey]);
  const add = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { name: newTask.trim(), done: false, extra: true }]);
    setNewTask('');
  };
  const completed = tasks.filter((task) => task.done).length;
  return (
    <>
      <Header
        eyebrow={`SUNDAY–SATURDAY · WEEK OF ${prettyDate(currentSunday).toUpperCase()}`}
        title="This week’s work"
        sub="The current week stays in focus. Past weeks remain visible and read-only."
        action={
          <button
            className="primary"
            onClick={() => document.getElementById('new-week-task')?.focus()}
          >
            + Add weekly task
          </button>
        }
      />
      <div className="weekly-focus">
        <section className="task-panel current-week-panel">
          <div className="section-title">
            <div>
              <p className="eyebrow coral">CURRENT WEEK · ENDS SATURDAY</p>
              <h2>
                {completed} of {tasks.length} completed
              </h2>
            </div>
            <span>{Math.round((completed / tasks.length) * 100)}%</span>
          </div>
          <div className="task-progress">
            <i style={{ width: `${(completed / tasks.length) * 100}%` }} />
          </div>
          <div className="quick-add">
            <input
              id="new-week-task"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add something extra for this week…"
              onKeyDown={(e) => e.key === 'Enter' && add()}
            />
            <button onClick={add}>Add to this week</button>
          </div>
          {tasks.map((t, i) => (
            <button
              className={`task-row ${t.done ? 'done' : ''}`}
              key={t.name}
              onClick={() =>
                setTasks(
                  tasks.map((x, j) => (j === i ? { ...x, done: !x.done } : x)),
                )
              }
            >
              <span>{t.done ? '✓' : ''}</span>
              <div>
                <strong>{t.name}</strong>
                <small>
                  {t.extra ? 'Added for this week' : 'Weekly baseline'}
                </small>
              </div>
            </button>
          ))}
        </section>
        <aside className="week-guide">
          <p className="eyebrow">HOW IT WORKS</p>
          <h2>Fresh focus every Sunday.</h2>
          <p>
            The four baseline responsibilities appear automatically. Add special
            priorities only when you need them.
          </p>
          <div>
            <strong>Sunday</strong>
            <span>New week opens</span>
          </div>
          <div>
            <strong>Saturday</strong>
            <span>Week locks at midnight</span>
          </div>
        </aside>
      </div>
      <section className="week-history">
        <p className="eyebrow">PAST WEEKS</p>
        <details>
          <summary>
            <span>
              <strong>Week of {prettyDate(previousSunday)}</strong>
              <small>4 completed · Locked</small>
            </span>
            <b>View work</b>
          </summary>
          {baselineTasks.map((task) => (
            <div className="locked-task" key={task.name}>
              <span>✓</span>
              {task.name}
              <small>Locked</small>
            </div>
          ))}
        </details>
      </section>
    </>
  );
}
function Hours() {
  type HourLog = {
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
  const total = logs.reduce((sum, log) => sum + Number(log.hours), 0);
  const addHours = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const date = new Date(String(form.get('date')) + 'T12:00:00');
    setLogs([
      {
        weekOf: dateKey(sundayOf(date)),
        date: String(form.get('date')),
        hours: Number(form.get('hours')),
        brands: String(form.get('brand')),
        notes: String(form.get('notes')),
        paid: false,
      },
      ...logs,
    ]);
    setShowForm(false);
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
                onChange={() =>
                  setLogs(
                    logs.map((log, i) =>
                      i === index ? { ...log, paid: !log.paid } : log,
                    ),
                  )
                }
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
        <h2>Add someone in seconds</h2>
        <p className="modal-helper">
          Name is the only required field. You can fill in the rest later.
        </p>
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
