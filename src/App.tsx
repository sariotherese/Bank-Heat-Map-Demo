import { useEffect, useMemo, useRef, useState } from 'react';
import { geoIdentity, geoPath } from 'd3-geo';
import type { FeatureCollection, Geometry } from 'geojson';
import {
  ArrowDownToLine, ArrowRight, ArrowUpRight, Building2, Check, ChevronDown,
  CircleHelp, Compass, Crosshair, Home, Layers, LayoutDashboard, MapPin,
  List, Map as MapIcon, Maximize, Minus, Plus, Search, SlidersHorizontal, Sparkles, Target, Users, X,
} from 'lucide-react';
import { compact, districts, filterDistricts, metricLabels, money, number, percent, rankDistricts, summarize } from './model';
import type { District, Metric } from './model';

type Boundaries = FeatureCollection<Geometry, { gid: number; name: string }>;
type View = { zoom: number; x: number; y: number };
const colors = ['#d9eee7', '#a4d6c2', '#67b69c', '#2d927b', '#096856'];
const initialView: View = { zoom: 1, x: 0, y: 0 };
const workspace = 'https://app.fabric.microsoft.com/groups/6d6350e8-6f22-4a8b-b06a-eb4a3b68dd23/list?experience=fabric-developer&subfolderId=102243';

function App() {
  const [metric, setMetric] = useState<Metric>('mortgageHolders');
  const [selected, setSelected] = useState<District | null>(null);
  const [hovered, setHovered] = useState<District | null>(null);
  const [query, setQuery] = useState('');
  const [boundaries, setBoundaries] = useState<Boundaries | null>(null);
  const [mapError, setMapError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [view, setView] = useState<View>(initialView);
  const [labels, setLabels] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [tab, setTab] = useState<'map' | 'districts'>('map');
  const [toast, setToast] = useState('');
  const drag = useRef<{ x: number; y: number; view: View; moved: boolean } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const modal = useRef<HTMLElement>(null);
  const rows = filterDistricts(query);
  const totals = summarize(selected ? [selected] : rows);
  const active = hovered ?? selected ?? districts[16];
  const maximum = Math.max(...districts.map(d => d[metric]));
  const ranked = rankDistricts(rows, metric);
  const path = useMemo(() => boundaries
    ? geoPath(geoIdentity().reflectY(true).fitExtent([[64, 32], [816, 598]], boundaries)) : null, [boundaries]);

  useEffect(() => {
    const controller = new AbortController();
    setMapError('');
    fetch(`${import.meta.env.BASE_URL}data/hcm-districts.geojson`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`Boundary request failed (${response.status})`);
        return response.json() as Promise<Boundaries>;
      }).then(data => {
        if (data.type !== 'FeatureCollection' || data.features.length !== 22 ||
          data.features.some(f => !districts.some(d => d.id === f.properties.gid))) {
          throw new Error('Boundary data does not match the 22 demo districts.');
        }
        setBoundaries(data);
      }).catch((error: unknown) => {
        if (!controller.signal.aborted) setMapError(error instanceof Error ? error.message : 'Unable to load district boundaries.');
      });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!infoOpen || !modal.current) return;
    const previousFocus = document.activeElement;
    const dialog = modal.current;
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>('button, a[href]'));
    focusable()[0]?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setInfoOpen(false);
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (event.shiftKey && document.activeElement === items[0]) {
        event.preventDefault();
        items.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
        event.preventDefault();
        items[0]?.focus();
      }
    }
    dialog.addEventListener('keydown', handleKey);
    return () => {
      dialog.removeEventListener('keydown', handleKey);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [infoOpen]);

  function zoom(factor: number) {
    setView(previous => ({ ...previous, zoom: Math.min(8, Math.max(1, previous.zoom * factor)) }));
  }

  function exportData() {
    const exportRows = selected ? [selected] : rows;
    const headers = Object.keys(districts[0]) as (keyof District)[];
    const csv = [headers.join(','), ...exportRows.map(d => headers.map(h => d[h]).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'eximbank-synthetic-mortgage-overview.csv';
    link.click();
    URL.revokeObjectURL(url);
    setToast(`Exported ${exportRows.length} synthetic district records`);
  }

  const cardData = [
    { title: 'Mortgage holders', value: compact(totals.mortgageHolders), icon: Home, note: 'All lenders · estimated people', style: 'blue' },
    { title: 'Working population', value: compact(totals.workingPopulation), icon: Users, note: 'Employed residents · demo estimate', style: 'violet' },
    { title: 'New opportunities', value: compact(totals.opportunities), icon: Target, note: 'Modeled potential new borrowers', style: 'green' },
    { title: 'Eximbank portfolio', value: money(totals.portfolioVnd), icon: Building2, note: `${number(totals.bankCustomers)} synthetic borrowers`, style: 'orange' },
  ];

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#" aria-label="Eximbank home"><span className="brand-mark">E<span>↗</span></span><span>Eximbank<small>MARKET INTELLIGENCE</small></span></a>
      <div className="workspace-label">WORKSPACE</div>
      <div className="workspace-name"><span className="workspace-icon"><Building2 size={17} /></span><div>Eximbank Demo<small>Retail banking</small></div><ChevronDown size={14} /></div>
      <div className="workspace-label navigation-label">ANALYTICS</div>
      <button className={`nav-item ${tab === 'map' ? 'active' : ''}`} onClick={() => setTab('map')}><LayoutDashboard size={18} />Mortgage overview<span className="nav-dot" /></button>
      <button className={`nav-item ${tab === 'districts' ? 'active' : ''}`} onClick={() => setTab('districts')}><MapPin size={18} />District explorer</button>
      <div className="sidebar-insight"><span className="insight-icon"><Sparkles size={20} /></span><strong>A clearer view.<br />A smarter opportunity.</strong><p>Explore the neighborhoods behind your next mortgage.</p><button onClick={() => setInfoOpen(true)}>About this demo <ArrowUpRight size={14} /></button></div>
      <div className="sidebar-bottom"><span className="avatar">EX</span><div>Eximbank team<small>Demo workspace</small></div><CircleHelp size={17} /></div>
    </aside>
    <main>
      <header className="topbar"><div className="breadcrumb">Eximbank Demo <span>/</span> <strong>Mortgage Overview App</strong></div><div className="topbar-right"><span className="demo-pill"><span /> Synthetic data</span><button className="icon-button" aria-label="About this demo" onClick={() => setInfoOpen(true)}><CircleHelp size={19} /></button><span className="avatar small">EX</span></div></header>
      <div className="page-content">
        <div className="page-heading"><div><div className="eyebrow">RETAIL BANKING INTELLIGENCE</div><h1>Mortgage overview<span>.</span></h1><p>Your next opportunity, mapped across Ho Chi Minh City.</p></div><button className="button export" onClick={exportData}><ArrowDownToLine size={16} />Export data</button></div>
        <div className="filter-bar"><span className="location-chip"><MapPin size={15} />Ho Chi Minh City</span><span className="filter-divider" /><span className="snapshot"><span />Snapshot: 30 Sep 2026</span><span className="historical-note">Historical 22-district geography</span><button className="text-button" onClick={() => setInfoOpen(true)}><SlidersHorizontal size={14} />Data & methodology</button></div>
        <div className="scope-row"><span>{selected ? `${selected.name} overview` : query ? `${rows.length} matching districts` : 'Citywide at a glance'}</span>{selected && <button className="text-button" onClick={() => setSelected(null)}>Clear district <X size={13} /></button>}<small>Illustrative figures, not actual Eximbank or census data</small></div>
        <section className="kpi-grid" aria-label="Key performance indicators">
          {cardData.map(({ title, value, icon: Icon, note, style }) => <article className="kpi-card" key={title}><div className="kpi-title">{title}<span className={`kpi-icon ${style}`}><Icon size={18} /></span></div><div className="kpi-value">{value}</div><div className="kpi-note">{note}</div></article>)}
        </section>
        <section className="analysis-grid">
          <article className="map-card">
            <div className="panel-heading"><div><h2>{tab === 'map' ? 'A city of possibilities' : 'Explore every district'}</h2><p>{tab === 'map' ? 'Hover to discover. Select a district to go deeper.' : 'Compare the people and potential behind each neighborhood.'}</p></div><button className="panel-tag" aria-label={tab === 'map' ? 'Show district table' : 'Show heat map'} onClick={() => setTab(tab === 'map' ? 'districts' : 'map')}>{tab === 'map' ? <List size={12} /> : <MapIcon size={12} />}{tab === 'map' ? 'List view' : 'Map view'}</button></div>
            <div className="map-toolbar"><div className="segmented" aria-label="Heat map metric">{(Object.keys(metricLabels) as Metric[]).map(key => <button key={key} className={metric === key ? 'selected' : ''} onClick={() => setMetric(key)}>{metricLabels[key]}</button>)}</div><button className={`icon-button label-toggle ${labels ? 'enabled' : ''}`} title="Toggle map labels" aria-label="Toggle map labels" aria-pressed={labels} onClick={() => setLabels(!labels)}><Layers size={17} /></button></div>
            {tab === 'map' ? <div className="map-stage">
              <div className="map-grid" />
              <div className="map-location"><Compass size={17} /><span>HO CHI MINH CITY<small>Vietnam · district boundaries</small></span></div>
              {mapError ? <div className="map-status" role="alert"><strong>Map unavailable</strong><p>{mapError}</p><button className="button" onClick={() => setAttempt(attempt + 1)}>Retry map</button></div> : !path || !boundaries ? <div className="map-status" role="status">Loading district boundaries…</div> :
                <svg ref={svg} className="district-map" viewBox="0 0 880 630" aria-label={`Interactive Ho Chi Minh City ${metricLabels[metric]} heat map`}
                  onPointerDown={event => {
                    if (event.button !== 0) return;
                    drag.current = { x: event.clientX, y: event.clientY, view, moved: false };
                  }}
                  onPointerMove={event => {
                    if (!drag.current || !svg.current) return;
                    const dx = (event.clientX - drag.current.x) * 880 / svg.current.getBoundingClientRect().width;
                    const dy = (event.clientY - drag.current.y) * 630 / svg.current.getBoundingClientRect().height;
                    if (Math.abs(dx) + Math.abs(dy) > 4) {
                      drag.current.moved = true;
                      svg.current.setPointerCapture(event.pointerId);
                      setHovered(null);
                      setView({ ...drag.current.view, x: drag.current.view.x + dx, y: drag.current.view.y + dy });
                    }
                  }}
                  onPointerUp={() => { setTimeout(() => { drag.current = null; }, 0); }}
                  onPointerCancel={() => { drag.current = null; }}
                  onPointerLeave={() => { setHovered(null); if (!drag.current?.moved) drag.current = null; }}>
                  <g transform={`translate(${440 + view.x}, ${315 + view.y}) scale(${view.zoom}) translate(-440, -315)`}>
                    {boundaries.features.map(feature => {
                      const district = districts.find(d => d.id === feature.properties.gid)!;
                      const visible = rows.some(d => d.id === district.id);
                      const level = Math.min(4, Math.floor(district[metric] / maximum * 5));
                      const centroid = path.centroid(feature);
                      const focused = selected?.id === district.id || hovered?.id === district.id;
                      return <g key={district.id}>
                        <path d={path(feature) ?? ''} fill={visible ? colors[level] : '#dce3de'} className={`district ${focused ? 'focused' : ''}`} strokeWidth={focused ? 2.8 : 1}
                          role="button" tabIndex={visible ? 0 : -1} aria-label={`${district.name}: ${number(district[metric])} ${metricLabels[metric].toLowerCase()}`} aria-pressed={selected?.id === district.id}
                          onPointerEnter={() => { if (visible && !drag.current?.moved) setHovered(district); }}
                          onPointerLeave={() => setHovered(null)}
                          onFocus={() => setHovered(district)} onBlur={() => setHovered(null)}
                          onClick={() => { if (visible && !drag.current?.moved) setSelected(selected?.id === district.id ? null : district); }}
                          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(selected?.id === district.id ? null : district); } }}
                        />
                        {labels && visible && (district.id >= 16 || district.id === 6 || view.zoom >= 2.1) && <text x={centroid[0]} y={centroid[1]} className={`district-label ${level >= 3 ? 'light' : ''}`} fontSize={district.id >= 16 ? 10 / Math.sqrt(view.zoom) : 7 / Math.sqrt(view.zoom)}>{district.name}<tspan x={centroid[0]} dy={12 / Math.sqrt(view.zoom)} className="district-count">{compact(district[metric])}</tspan></text>}
                      </g>;
                    })}
                  </g>
                </svg>}
              {hovered && <div className="map-tooltip" role="status"><span>AREA SNAPSHOT · SYNTHETIC</span><strong>{hovered.name}</strong><div>Mortgage holders<b>{number(hovered.mortgageHolders)}</b></div><div>Working population<b>{number(hovered.workingPopulation)}</b></div><div>New opportunities<b>{number(hovered.opportunities)}</b></div><div>Eximbank portfolio<b>{money(hovered.portfolioVnd)}</b></div><small>Select district to pin its portfolio →</small></div>}
              <div className="map-controls"><button aria-label="Zoom in" onClick={() => zoom(1.4)}><Plus size={18} /></button><button aria-label="Zoom out" onClick={() => zoom(1 / 1.4)}><Minus size={18} /></button><span /><button aria-label="Reset map view" onClick={() => setView(initialView)}><Maximize size={17} /></button><button aria-label="Focus urban center" onClick={() => setView({ zoom: 2.6, x: 55, y: -5 })}><Crosshair size={17} /></button></div>
              <div className="map-legend"><strong>{metricLabels[metric]}</strong><div className="legend-gradient" /><div><span>0</span><span>{compact(maximum)}</span></div><small>Absolute count · darker = higher</small></div>
              <span className="map-hint">Drag to pan · + / − to zoom</span><span className="north-arrow">N<span>↑</span></span>
              <div className="map-attribution">© OpenStreetMap contributors · historical boundaries, 2021 · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">ODbL</a></div>
            </div> : <div className="district-table-wrap"><table><thead><tr><th>District / city</th><th>Mortgage holders</th><th>Working population</th><th>Opportunities</th></tr></thead><tbody>{ranked.map(d => <tr key={d.id} className={selected?.id === d.id ? 'selected-row' : ''}><td><button onClick={() => setSelected(d)}>{d.name}</button></td><td>{number(d.mortgageHolders)}</td><td>{number(d.workingPopulation)}</td><td>{number(d.opportunities)}</td></tr>)}</tbody></table>{!ranked.length && <p className="empty-state">No districts match “{query}”.</p>}</div>}
            <div className="map-footer"><span><span className="tiny-dot" />Real geography. Illustrative opportunity.</span><button className="text-button" onClick={() => setInfoOpen(true)}>How to read this map <ArrowUpRight size={13} /></button></div>
          </article>
          <aside className="portfolio-card">
            <div className="portfolio-eyebrow"><span><MapPin size={13} />AREA SPOTLIGHT</span><span className="synthetic-label">DEMO</span></div>
            <h2>{active.name}</h2><p className="portfolio-subtitle">{hovered ? 'Hover preview' : selected ? 'Selected district' : 'Featured opportunity'} · Ho Chi Minh City</p>
            <div className="portfolio-total"><span>Eximbank mortgage portfolio</span><strong>{money(active.portfolioVnd)}<span>VND</span></strong><small>{number(active.bankCustomers)} Eximbank borrowers</small></div>
            <div className="portfolio-stats"><div><span>Mortgage holders</span><strong>{number(active.mortgageHolders)}</strong></div><div><span>Working population</span><strong>{compact(active.workingPopulation)}</strong></div><div><span>Mortgage penetration</span><strong>{percent(active.mortgageHolders / active.workingPopulation)}</strong></div><div><span>Average loan</span><strong>₫{(active.averageLoanVnd / 1e9).toFixed(1)}B</strong></div></div>
            <div className="profile"><h3>Borrower profile <span>Synthetic mix</span></h3><div className="profile-bar"><i style={{ width: `${active.salariedShare}%` }} /><i style={{ width: `${100 - active.salariedShare - active.affluentShare}%` }} /><i style={{ width: `${active.affluentShare}%` }} /></div><div className="profile-legend"><span><i />Salaried<b>{active.salariedShare}%</b></span><span><i />Self-employed<b>{100 - active.salariedShare - active.affluentShare}%</b></span><span><i />Other / affluent<b>{active.affluentShare}%</b></span></div></div>
            <div className="opportunity-box"><span><Sparkles size={15} />ROOM TO GROW</span><div>{number(active.opportunities)}<small>potential new borrowers</small></div><p>{money(active.potentialVnd)} illustrative lending potential</p><div className="opportunity-foot">Modeled estimate, not qualified leads</div></div>
            <button className="button primary portfolio-action" onClick={() => { setSelected(active); setTab('districts'); }}>Explore district <ArrowRight size={16} /></button>
          </aside>
        </section>
        <section className="ranking-card"><div className="ranking-heading"><div><h2>Where opportunity lives</h2><p>Compare districts by {metricLabels[metric].toLowerCase()}.</p></div><label className="search-field"><Search size={16} /><input placeholder="Search districts…" aria-label="Search districts" value={query} onChange={event => { setQuery(event.target.value); setSelected(null); }} />{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={14} /></button>}</label></div><div className="ranking-grid">{ranked.slice(0, 5).map((d, index) => <button className={`rank-item ${selected?.id === d.id ? 'rank-selected' : ''}`} key={d.id} onClick={() => setSelected(d)}><div><span className="rank-number">0{index + 1}</span><ArrowUpRight size={16} /></div><strong>{d.name}</strong><span className="rank-value">{number(d[metric])}<small>{metricLabels[metric].toLowerCase()}</small></span><div className="rank-track"><span style={{ width: `${d[metric] / maximum * 100}%` }} /></div></button>)}{!ranked.length && <p className="empty-state">No districts found. Try “Thu Duc” or clear your search.</p>}</div></section>
        <footer className="page-footer"><span>EXIMBANK <i />Mortgage Overview App</span><span>Synthetic demo · No personal or customer data · <button onClick={() => setInfoOpen(true)}>Source & methodology</button></span></footer>
      </div>
    </main>
    {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
    {infoOpen && <div className="modal-backdrop" onClick={() => setInfoOpen(false)}><section ref={modal} className="modal" role="dialog" aria-modal="true" aria-labelledby="methodology-title" onClick={event => event.stopPropagation()}><button className="icon-button modal-close" aria-label="Close methodology" onClick={() => setInfoOpen(false)}><X size={20} /></button><span className="eyebrow">TRANSPARENT BY DESIGN</span><h2 id="methodology-title">About this demonstration</h2><p>All population, mortgage, borrower profile and portfolio figures are deterministic synthetic data. They are not official statistics, actual Eximbank holdings, credit decisions or verified sales leads. No individual customer records are used.</p><h3>Opportunity model</h3><p>Potential new borrowers = eligible non-borrowers × assumed borrowing propensity (14–24%). Eligible non-borrowers are an illustrative 6.5–10.5% of working residents without mortgages. Lending potential = potential borrowers × assumed average loan. Portfolio = synthetic Eximbank borrowers × average loan.</p><h3>Geographic scope</h3><p>Real OpenStreetMap-derived boundaries from 2021 cover the historical 22 districts / Thu Duc City of pre-2025 Ho Chi Minh City. This is not the current expanded municipality or current ward structure. Heat colors show absolute counts, not population density.</p><h3>Fabric destination · not published</h3><p>Application: <strong>Mortgage Overview App</strong><br />Folder: <strong>Eximbank Demo</strong> · ID 102243</p><a href={workspace} target="_blank" rel="noreferrer" className="button primary">Open target Fabric workspace <ArrowUpRight size={15} /></a><p className="modal-note">This is a standalone web demo, not a Rayfin-native artifact. Rayfin packaging and authenticated Fabric publishing must be completed manually. See the repository README.</p><p className="modal-note">Boundaries: <a href="https://github.com/nguyencaonhan271201/tphcm_district_boundaries" target="_blank" rel="noreferrer">Nguyễn Cao Nhân</a> (MIT), derived from © OpenStreetMap contributors (ODbL).</p></section></div>}
  </div>;
}

export default App;
