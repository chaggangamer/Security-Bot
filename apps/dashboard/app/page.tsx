import {
  Activity,
  Bell,
  Bot,
  ChevronDown,
  CircleDot,
  FileClock,
  Fingerprint,
  Gauge,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessageSquareText,
  Radar,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from 'lucide-react';
import { connection } from 'next/server';

const navigation: Array<{
  label: string;
  items: Array<{ label: string; icon: LucideIcon; active?: boolean; count?: string }>;
}> = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', icon: LayoutDashboard, active: true },
      { label: 'Live activity', icon: Activity, count: '12' },
    ],
  },
  {
    label: 'Security',
    items: [
      { label: 'Security center', icon: ShieldCheck },
      { label: 'Incidents', icon: ShieldAlert, count: '3' },
      { label: 'Risk engine', icon: Radar },
      { label: 'Permission scan', icon: KeyRound },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Members', icon: Users },
      { label: 'Messages', icon: MessageSquareText },
      { label: 'Cases', icon: FileClock },
      { label: 'Tickets', icon: TicketCheck },
      { label: 'Workflows', icon: Workflow },
    ],
  },
];

const activityFeed = [
  {
    time: '20:48:12',
    title: 'Suspicious link blocked',
    detail: '#general · @nightshift',
    tone: 'critical',
  },
  {
    time: '20:48:04',
    title: 'Verification completed',
    detail: '@riley · account age 2y',
    tone: 'success',
  },
  {
    time: '20:47:57',
    title: 'AutoMod deleted mention spam',
    detail: '#lounge · 8 mentions',
    tone: 'warning',
  },
  { time: '20:47:44', title: 'Role added', detail: 'Member → @verified', tone: 'neutral' },
  {
    time: '20:47:35',
    title: 'Member joined',
    detail: '@marin · invite /community',
    tone: 'neutral',
  },
];

const incidents = [
  {
    id: 'INC-1042',
    name: 'Coordinated link burst',
    severity: 'HIGH',
    state: 'Investigating',
    ago: '2m',
  },
  {
    id: 'INC-1041',
    name: 'Mention spam cluster',
    severity: 'MEDIUM',
    state: 'Contained',
    ago: '18m',
  },
  { id: 'INC-1039', name: 'Permission escalation', severity: 'HIGH', state: 'Resolved', ago: '4h' },
];

const bars = [
  32, 36, 34, 45, 41, 54, 48, 58, 65, 52, 71, 68, 83, 74, 88, 76, 62, 69, 57, 52, 44, 48, 41, 37,
];

function Brand() {
  return (
    <div className="brand">
      <span className="brandMark" aria-hidden="true">
        <ShieldCheck size={19} strokeWidth={2.2} />
      </span>
      <span>Aegis</span>
      <span className="version">BETA</span>
    </div>
  );
}

function GuildPicker() {
  return (
    <button className="guildPicker" type="button" aria-label="Current preview server">
      <span className="guildAvatar">N</span>
      <span className="guildText">
        <strong>Northstar</strong>
        <small>Preview workspace</small>
      </span>
      <ChevronDown size={16} aria-hidden="true" />
    </button>
  );
}

function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <Brand />
      <GuildPicker />
      <nav className="navGroups">
        {navigation.map((group) => (
          <section key={group.label} className="navGroup">
            <h2>{group.label}</h2>
            {group.items.map((item) => (
              <a
                className={item.active ? 'navItem active' : 'navItem'}
                href={
                  item.active
                    ? '#main-content'
                    : `#${item.label.toLowerCase().replaceAll(' ', '-')}`
                }
                key={item.label}
              >
                <item.icon size={17} aria-hidden="true" />
                <span>{item.label}</span>
                {item.count ? <small>{item.count}</small> : null}
              </a>
            ))}
          </section>
        ))}
      </nav>
      <div className="sidebarFooter">
        <a className="navItem" href="#settings">
          <Settings size={17} aria-hidden="true" />
          <span>Settings</span>
        </a>
        <div className="operator">
          <span className="operatorAvatar">GA</span>
          <span>
            <strong>Garv Arora</strong>
            <small>Security admin</small>
          </span>
        </div>
      </div>
    </aside>
  );
}

function MobileHeader() {
  return (
    <header className="mobileHeader">
      <Brand />
      <details className="mobileMenu">
        <summary aria-label="Open navigation">
          <Menu className="menuOpenIcon" size={20} />
          <X className="menuCloseIcon" size={20} />
          <span className="srOnly">Menu</span>
        </summary>
        <div className="mobileSheet">
          <div className="mobileSheetHead">
            <span>Navigation</span>
          </div>
          <GuildPicker />
          {navigation
            .flatMap((group) => group.items)
            .map((item) => (
              <a
                href={
                  item.active
                    ? '#main-content'
                    : `#${item.label.toLowerCase().replaceAll(' ', '-')}`
                }
                key={item.label}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </a>
            ))}
        </div>
      </details>
    </header>
  );
}

function Metric({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta: string;
  icon: typeof Activity;
}) {
  return (
    <article className="metricCard">
      <div className="metricTop">
        <span>{label}</span>
        <Icon size={17} aria-hidden="true" />
      </div>
      <strong>{value}</strong>
      <small>{delta}</small>
    </article>
  );
}

function ActivityChart() {
  return (
    <div
      className="activityChart"
      role="img"
      aria-label="Message activity over 24 intervals, peaking at 312 messages per minute"
    >
      <div className="chartGrid">
        <span>320</span>
        <span>240</span>
        <span>160</span>
        <span>80</span>
      </div>
      <div className="bars" aria-hidden="true">
        {bars.map((height, index) => (
          <span style={{ height: `${height}%` }} key={`${height}-${index}`} />
        ))}
      </div>
      <div className="chartAxis">
        <span>20:00</span>
        <span>20:15</span>
        <span>20:30</span>
        <span>Now</span>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  await connection();
  return (
    <div className="appShell">
      <Sidebar />
      <MobileHeader />
      <main id="main-content" className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Security operations center</p>
            <h1>Good evening, Garv</h1>
          </div>
          <div className="topActions">
            <button
              className="searchButton"
              type="button"
              aria-label="Search is available after connecting a server"
            >
              <Search size={16} />
              <span>Search</span>
              <kbd>⌘ K</kbd>
            </button>
            <button className="iconButton" type="button" aria-label="Notifications">
              <Bell size={18} />
            </button>
          </div>
        </header>

        <div className="previewNotice" role="status">
          <Sparkles size={16} aria-hidden="true" />
          <span>
            <strong>Preview data.</strong> Connect Discord OAuth and the event pipeline before using
            this dashboard for operations.
          </span>
        </div>

        <section className="heroGrid" aria-labelledby="posture-title">
          <article className="postureCard">
            <div className="sectionHeading">
              <div>
                <p className="eyebrow">Current posture</p>
                <h2 id="posture-title">Server security</h2>
              </div>
              <span className="liveTag">
                <span /> Live
              </span>
            </div>
            <div className="postureBody">
              <div className="scoreRing" aria-label="Security score 91 out of 100">
                <div>
                  <strong>91</strong>
                  <span>/100</span>
                </div>
              </div>
              <div className="postureCopy">
                <span className="statusPill">
                  <ShieldCheck size={15} /> Protected
                </span>
                <h3>All critical systems are active.</h3>
                <p>
                  One permission recommendation needs review. No active raid or nuke pattern is
                  detected.
                </p>
                <a href="#permission-scan">
                  Review recommendation <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
            <div className="coverage">
              <div>
                <span>Anti-raid</span>
                <strong>Active</strong>
              </div>
              <div>
                <span>Anti-nuke</span>
                <strong>Active</strong>
              </div>
              <div>
                <span>AutoMod</span>
                <strong>Active</strong>
              </div>
              <div>
                <span>Archive</span>
                <strong className="mutedValue">Off</strong>
              </div>
            </div>
          </article>

          <article className="threatCard">
            <div className="sectionHeading">
              <div>
                <p className="eyebrow">Threat level</p>
                <h2>Normal</h2>
              </div>
              <Gauge size={20} aria-hidden="true" />
            </div>
            <div className="threatTrack" aria-label="Threat level normal, 18 out of 100">
              <span style={{ width: '18%' }} />
            </div>
            <div className="threatScale">
              <span>Normal</span>
              <span>Elevated</span>
              <span>Raid</span>
            </div>
            <div className="signalRows">
              <div>
                <span>
                  <CircleDot size={14} /> Join velocity
                </span>
                <strong>3 / min</strong>
              </div>
              <div>
                <span>
                  <Fingerprint size={14} /> Young accounts
                </span>
                <strong>2.1%</strong>
              </div>
              <div>
                <span>
                  <LockKeyhole size={14} /> Blocked links
                </span>
                <strong>7 today</strong>
              </div>
            </div>
          </article>
        </section>

        <section className="metrics" aria-label="Server metrics">
          <Metric label="Members" value="18,482" delta="+126 this week" icon={Users} />
          <Metric
            label="Messages / min"
            value="216"
            delta="12% below peak"
            icon={MessageSquareText}
          />
          <Metric label="AutoMod actions" value="641" delta="24h rolling total" icon={Bot} />
          <Metric label="Open incidents" value="3" delta="1 needs attention" icon={ShieldAlert} />
        </section>

        <section className="operationsGrid">
          <article className="panel activityPanel" id="live-activity">
            <div className="panelHeading">
              <div>
                <p className="eyebrow">Traffic pulse</p>
                <h2>Message activity</h2>
              </div>
              <div className="legend">
                <span /> Messages / min
              </div>
            </div>
            <ActivityChart />
          </article>
          <article className="panel feedPanel">
            <div className="panelHeading">
              <div>
                <p className="eyebrow">Event stream</p>
                <h2>Live activity</h2>
              </div>
              <span className="feedStatus">
                <span /> Streaming
              </span>
            </div>
            <ol className="feedList">
              {activityFeed.map((event) => (
                <li key={`${event.time}-${event.title}`}>
                  <time>{event.time}</time>
                  <span className={`eventDot ${event.tone}`} />
                  <div>
                    <strong>{event.title}</strong>
                    <small>{event.detail}</small>
                  </div>
                </li>
              ))}
            </ol>
          </article>
        </section>

        <section className="panel incidentsPanel" id="incidents">
          <div className="panelHeading">
            <div>
              <p className="eyebrow">Incident intelligence</p>
              <h2>Recent incidents</h2>
            </div>
            <a href="#incidents">
              View all <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Incident</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Detected</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="incidentIcon">
                        <ShieldAlert size={16} />
                      </span>
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.id}</small>
                      </span>
                    </td>
                    <td>
                      <span className={`severity ${item.severity.toLowerCase()}`}>
                        {item.severity}
                      </span>
                    </td>
                    <td>{item.state}</td>
                    <td>{item.ago} ago</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="lowerGrid">
          <article className="panel systemPanel" id="security-center">
            <div className="panelHeading">
              <div>
                <p className="eyebrow">Service health</p>
                <h2>Security systems</h2>
              </div>
              <Activity size={19} />
            </div>
            {[
              ['Discord gateway', 'Connected', '42ms'],
              ['Event evaluator', 'Healthy', '18ms p95'],
              ['PostgreSQL', 'Not connected', 'Preview'],
              ['Redis windows', 'Not connected', 'Preview'],
            ].map(([name, status, detail], index) => (
              <div className="systemRow" key={name}>
                <span className={index < 2 ? 'healthDot' : 'healthDot idle'} />
                <strong>{name}</strong>
                <span>{status}</span>
                <small>{detail}</small>
              </div>
            ))}
          </article>
          <article className="panel recommendation" id="permission-scan">
            <div className="recommendationIcon">
              <KeyRound size={20} />
            </div>
            <p className="eyebrow">Permission recommendation</p>
            <h2>Review 2 administrator roles</h2>
            <p>
              Roles with Administrator bypass channel restrictions and increase blast radius. Aegis
              never edits permissions silently.
            </p>
            <div className="recommendationMeta">
              <span>
                Severity <strong>Medium</strong>
              </span>
              <span>
                Impact <strong>2 roles</strong>
              </span>
            </div>
            <a href="#permission-scan">
              Open permission scan <span aria-hidden="true">→</span>
            </a>
          </article>
        </section>

        <footer className="pageFooter">
          <span>Aegis control plane · Preview environment</span>
          <span>UTC+05:30 · All event timestamps stored in UTC</span>
        </footer>
      </main>
    </div>
  );
}
