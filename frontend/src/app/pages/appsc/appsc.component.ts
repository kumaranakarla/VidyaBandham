import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// APPSC (Andhra Pradesh Public Service Commission) Model Papers tab.
// Deliberately its own route/component (see app.routes.ts), the same
// isolation pattern used for Tet2026Component, so this new exam-body
// section can be built out (papers grouped by Group -> year -> subject)
// without touching the TET routes/components or school-management tabs
// at all. No question content has been sourced yet — this page shows
// the four groups the app will eventually cover, without a "coming
// soon" label per the user's explicit request (2026-09-27). See the
// project plan doc's "APPSC Model Papers feature" section for the
// sourcing plan and open decisions (which years/papers to prioritize
// per group, pricing/access model).
@Component({
  selector: 'app-appsc',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>{{ lang === 'te' ? 'APPSC మోడల్ పేపర్లు' : 'APPSC Model Papers' }}</h2>

    <div class="lang-toggle">
      <button type="button" [class.active]="lang === 'en'" (click)="lang = 'en'">English</button>
      <button type="button" [class.active]="lang === 'te'" (click)="lang = 'te'">తెలుగు</button>
    </div>

    <p class="intro" *ngIf="lang === 'en'">
      Previous-year and model question papers for APPSC (Andhra Pradesh Public Service Commission)
      recruitment exams, organized by Group, year, and subject — the same way the TET tabs are
      organized by paper and year.
    </p>
    <p class="intro" *ngIf="lang === 'te'">
      APPSC (ఆంధ్రప్రదేశ్ పబ్లిక్ సర్వీస్ కమిషన్) రిక్రూట్‌మెంట్ పరీక్షల మునుపటి సంవత్సరం మరియు మోడల్
      ప్రశ్నపత్రాలు, గ్రూప్, సంవత్సరం, మరియు సబ్జెక్టు వారీగా అమర్చబడతాయి.
    </p>

    <div class="group-grid">
      <div class="group-card" *ngFor="let g of groups">
        <div class="group-name">{{ g.name }}</div>
        <div class="group-desc">{{ lang === 'te' ? g.descTe : g.desc }}</div>
      </div>
    </div>
  `,
  styles: [
    `
      h2 { color: #2c4870; display: flex; align-items: center; gap: 0.6rem; }
      .lang-toggle { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem 0.8rem; margin-bottom: 1rem; }
      .lang-toggle button {
        padding: 0.4rem 1rem; border-radius: 999px; border: 1px solid #ccc;
        background: #fafafa; cursor: pointer; font-size: 0.9rem;
      }
      .lang-toggle button.active { background: #2c4870; border-color: #2c4870; color: white; }
      .intro { color: #555; margin-top: -0.3rem; margin-bottom: 1.2rem; max-width: 65ch; }
      .group-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
      .group-card {
        background: white; padding: 1rem 1.1rem; border-radius: 10px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06); border: 1px solid transparent;
      }
      .group-name { font-weight: 700; color: #222; margin-bottom: 0.3rem; }
      .group-desc { font-size: 0.85rem; color: #666; }
    `,
  ],
})
export class AppscComponent {
  lang: 'en' | 'te' = 'en';

  groups = [
    {
      name: 'Group-1',
      desc: 'Civil service posts (e.g. Deputy Collector, DSP) — prelims + mains.',
      descTe: 'పౌర సేవా పోస్టులు (ఉదా. డిప్యూటీ కలెక్టర్, DSP) — ప్రిలిమ్స్ + మెయిన్స్.',
    },
    {
      name: 'Group-2',
      desc: 'Executive & non-executive posts across departments.',
      descTe: 'వివిధ శాఖలలో ఎగ్జిక్యూటివ్ & నాన్-ఎగ్జిక్యూటివ్ పోస్టులు.',
    },
    {
      name: 'Group-3',
      desc: 'Panchayat Secretary and related posts.',
      descTe: 'పంచాయతీ సెక్రటరీ మరియు సంబంధిత పోస్టులు.',
    },
    {
      name: 'Group-4',
      desc: 'Junior Assistant and other junior-level posts.',
      descTe: 'జూనియర్ అసిస్టెంట్ మరియు ఇతర జూనియర్-స్థాయి పోస్టులు.',
    },
  ];
}
