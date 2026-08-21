# Chart shape-swap evidence (J11)

NETWORK NOTE: Chart.js CDN (cdnjs.cloudflare.com) is denied by this sandbox's egress policy (403, confirmed by curl before writing tests) — canvas pixels could not be captured here. Every row below was produced by calling the real, exported production functions (`window.aiExtractCharts` -> `window.aiHonourShape` (bare-called inside it) -> `window.aiChartHtml` -> `aiBreakdownConfig`/`AI_CHART_RECIPES`) in a real Chromium instance against live `state.contracts`.

| ask | kind asked | shape drawn | before | after |
|---|---|---|---|---|
| give the status in bar graph format | statusBreakdown (doughnut, baked) | bar | `{"type":"doughnut","labels":["Draft","Under Review","Signed","Declined"],"data":[[2,1,2,1]]}` | `{"type":"bar","labels":["Draft","Under Review","Signed","Declined"],"data":[[2,1,2,1]]}` |
| show risk as a line chart please | riskBands (doughnut, baked) | line | `{"type":"doughnut","labels":["Low","Medium","High"],"data":[[2,1,2]]}` | `{"type":"line","labels":["Low","Medium","High"],"data":[[2,1,2]]}` |
| give me the expiry timeline as a pie chart | expiryTimeline (bar, baked) | pie | `{"type":"bar","labels":["Aug 2026","Sept 2026","Oct 2026","Nov 2026","Dec 2026","Jan 2027","Feb 2027","Mar 2027","Apr 2027","May 2027","Jun ` | `{"type":"pie","labels":["Sept 2026","Oct 2026","Mar 2027"],"data":[[1,1,1]]}` |
| value by counterparty as a pie chart | valueByCounterparty (not on swap list) | bar | `(fixed recipe, no baseline needed)` | `{"kind":"valueByCounterparty","title":"valueByCounterparty"}` |
| value stream split as a pie chart | valueStreamSplit (not on swap list) | bar | `(fixed recipe, no baseline needed)` | `{"kind":"valueStreamSplit","title":"valueStreamSplit"}` |
| renewal pipeline as a pie chart | renewalPipeline (not on swap list) | bar | `(fixed recipe, no baseline needed)` | `{"kind":"renewalPipeline","title":"renewalPipeline"}` |
| cycle time as a pie chart | cycleTime (not on swap list) | (no data on this fixture) | `(fixed recipe, no baseline needed)` | `{"kind":"cycleTime","title":"cycleTime"}` |
| obligations due as a pie chart | obligationsDue (not on swap list) | (no data on this fixture) | `(fixed recipe, no baseline needed)` | `{"kind":"obligationsDue","title":"obligationsDue"}` |
| barred by the limitation period | (false-positive probe) | none (correct) | `` | `` |
| the bar association requires notice | (false-positive probe) | none (correct) | `` | `` |
| please sign on the dotted line | (false-positive probe) | none (correct) | `` | `` |
