# LAYOUT_RISKS

Swedish values more than **40%** longer than their English
counterpart. Swedish runs longer than English as a rule, so this is where the
build is most likely to *look* wrong while every test passes.

Regenerate with `node test/i18n-audit.js --layout`. Nothing here has been
seen rendered — this container cannot reach the CDN the app loads its
stylesheet from, so every entry needs a human with a browser.

## Width-constrained — check these first

These land in the 210px sidebar, a status or risk chip, a command-bar button,
or a board column heading, where there is no room to grow.

| Key | English | Swedish | Growth |
|---|---|---|---|
| `nav_doc` | Doc | Dokument | +167% |
| `approval_role_admin` | Admin | Administratör | +160% |
| `role_admin` | Admin | Administratör | +160% |
| `value_nm` | n/m | ej bel. | +133% |
| `stream_sales` | Sales | Försäljning | +120% |
| `status_under_review` | In Review | Under granskning | +78% |
| `share_sent` | Sent | Skickat | +75% |
| `nav_sec_settings` | Settings | Inställningar | +63% |
| `stream_mktg` | Marketing | Marknadsföring | +56% |
| `nav_sec_work` | Work | Arbete | +50% |
| `cmd_export` | Export | Exportera | +50% |
| `cmd_panel_title` | Toggle context panel | Visa eller dölj kontextpanelen | +50% |
| `nav_team` | Team & settings | Team och inställningar | +47% |
| `cmd_title_team` | Team & Settings | Team och inställningar | +47% |
| `share_revoked` | Revoked | Återkallat | +43% |

## Elsewhere in the layout

Subtitles, empty states, dialog bodies and table cells — more forgiving, but
worth a glance for wrapping.

| Key | English | Swedish | Growth |
|---|---|---|---|
| `advice_row_rate` | Rate | Timarvode | +125% |
| `rel_minutes` | {n}m ago | för {n} min sedan | +113% |
| `rel_hours` | {n}h ago | för {n} tim sedan | +113% |
| `rel_days` | {n}d ago | för {n} dgr sedan | +113% |
| `advice_kpi_due48` | Due in 48h | Förfaller inom 48 tim | +110% |
| `rel_months` | {n}mo ago | för {n} mån sedan | +89% |
| `cp_kind_folder` | folder | värdeflöde | +67% |
| `report_metric_avg_risk` | Avg risk score | Genomsnittlig riskpoäng | +64% |
| `advice_lbl_note` | Add internal note | Lägg till intern anteckning | +59% |
| `advice_row_feedback_due` | Feedback due | Återkoppling senast | +58% |
| `advice_stage_scoping` | Scoping | Avgränsning | +57% |
| `advice_eta_today` | due today | förfaller idag | +56% |
| `report_metric_age_review` | Avg age · in review | Snittålder · under granskning | +53% |
| `advice_in_title` | Log an advice request | Registrera ett rådgivningsärende | +52% |
| `advice_row_estimate` | Estimate | Uppskattning | +50% |
| `cal_note_decide_by` | decide by | beslut senast | +44% |
| `advice_h_notes` | Internal notes | Interna anteckningar | +43% |
| `cal_agenda_title` | Next 60 days | Kommande 60 dagar | +42% |
| `advice_no_notes` | No internal notes yet. | Inga interna anteckningar ännu. | +41% |

---

**34** of 315 keys exceed the
threshold; **15** of them are width-constrained.
