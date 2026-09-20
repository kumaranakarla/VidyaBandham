import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

// One shared component for the three public legal/policy pages (Terms,
// Privacy, Refund & Cancellation), branching on the route path the same way
// GrandTestComponent branches on /mock-test vs /tet-2026 vs /grand-test —
// same content shape, different copy, no reason for three near-identical
// files. All three routes are public (no authGuard), same as /login and
// /signup, since Razorpay checkout and prospective signups need to reach
// these without an account.
//
// NOTE: this is template legal copy written to cover the basics for a small
// Indian EdTech subscription app using Razorpay — it is NOT a substitute for
// a lawyer's review, especially before scaling up or if requirements change
// (e.g. GST registration, a different payment processor, collecting more
// personal data). Treat it as a reasonable starting point, not a finished
// compliance document.
interface Section {
  heading: string;
  paragraphs: string[];
}

interface PolicyContent {
  title: string;
  updated: string;
  sections: Section[];
}

const TERMS: PolicyContent = {
  title: 'Terms & Conditions',
  updated: 'Last updated: September 2026',
  sections: [
    {
      heading: '1. About Vidya Bandham',
      paragraphs: [
        'Vidya Bandham ("the Platform", "we", "us") is a school parent-teacher management tool and an AP TET (Teacher Eligibility Test) exam preparation tool, operated as an independent product. We are not affiliated with, endorsed by, or connected to the Commissionerate of School Education, Government of Andhra Pradesh, or any official TET examination body. Practice questions on the Platform are drawn from officially published past exam papers and are provided solely for practice and self-study.',
      ],
    },
    {
      heading: '2. Accounts',
      paragraphs: [
        'Teacher and parent accounts are created for you by your school. TET Prep subscriber accounts can be created by anyone through the public sign-up page. You are responsible for keeping your login credentials confidential and for all activity under your account. Please provide accurate information when creating an account and let us know if any of it changes.',
      ],
    },
    {
      heading: '3. Free access and paid subscriptions',
      paragraphs: [
        'A limited number of TET 2026 practice papers are free to attempt in full, with no payment required and no time limit on that access. Additional papers require an active paid subscription, purchased through Razorpay. Prices shown at checkout are final at the time of purchase; we may change pricing for future purchases at any time, which will not affect a subscription you have already paid for.',
      ],
    },
    {
      heading: '4. Accuracy of practice content',
      paragraphs: [
        'We take reasonable care transcribing questions, options, and answer keys from official published papers, and we do not invent or guess at content — where a source paper\'s own answer key was ambiguous or marked as a discrepancy, we either flag it clearly or leave it out entirely rather than presenting a guessed answer as fact. Even so, practice papers on the Platform may occasionally contain transcription errors and should not be treated as a substitute for official exam material. If you spot an error, please tell us at the contact details below so we can fix it.',
      ],
    },
    {
      heading: '5. Acceptable use',
      paragraphs: [
        'Please don\'t attempt to scrape, resell, or redistribute the question bank, share a paid account\'s access with people who haven\'t subscribed, or interfere with the Platform\'s normal operation. We may suspend or terminate accounts that misuse the service.',
      ],
    },
    {
      heading: '6. Limitation of liability',
      paragraphs: [
        'The Platform is provided "as is". We work to keep it reliable and accurate, but we don\'t guarantee uninterrupted availability or that practicing here will result in any particular exam outcome. To the extent permitted by law, we aren\'t liable for indirect or consequential losses arising from your use of the Platform.',
      ],
    },
    {
      heading: '7. Changes to these terms',
      paragraphs: [
        'We may update these terms from time to time as the Platform changes. Continuing to use the Platform after an update means you accept the revised terms.',
      ],
    },
    {
      heading: '8. Contact',
      paragraphs: [
        'Questions about these terms? Reach us at support@vidyabandham.com or call 8884099770 / 9030523776.',
      ],
    },
  ],
};

const PRIVACY: PolicyContent = {
  title: 'Privacy Policy',
  updated: 'Last updated: September 2026',
  sections: [
    {
      heading: '1. What we collect',
      paragraphs: [
        'Account details you give us directly: name, email address, and a password (which we store as a one-way hash — we never store or see your plain-text password). For school accounts, your school may enter additional records such as attendance, homework, fee, and diary entries for students. For TET Prep, we record which papers and questions you\'ve attempted and your scores, so you can track your own progress.',
        'When you subscribe, payment is handled entirely by Razorpay. We never see or store your card, UPI, or netbanking details — we only receive a payment confirmation and an order/payment ID from Razorpay to activate your subscription.',
      ],
    },
    {
      heading: '2. How we use it',
      paragraphs: [
        'To run the Platform: signing you in, showing your school\'s diary/attendance/fees data to the right people, tracking your TET practice progress, processing subscription payments, and responding when you contact support. We do not sell your data to anyone, and we do not use it for advertising.',
      ],
    },
    {
      heading: '3. Third parties we use',
      paragraphs: [
        'Razorpay for payment processing (see their own privacy policy for how they handle payment data). Render and Netlify to host the Platform\'s backend and website. None of these providers use your data for anything beyond providing their service to us.',
      ],
    },
    {
      heading: '4. Children\'s data',
      paragraphs: [
        'Student records (attendance, homework, fees, diary entries) are entered and managed by the school and viewed by the student\'s own parent/teacher — we don\'t collect this data directly from children, and student accounts aren\'t created for children to log in with themselves.',
      ],
    },
    {
      heading: '5. Security',
      paragraphs: [
        'Passwords are hashed before storage, and sign-in uses signed session tokens. As with any online service, we can\'t guarantee absolute security, but we take reasonable, standard precautions to protect your data.',
      ],
    },
    {
      heading: '6. Cookies and local storage',
      paragraphs: [
        'We use browser local storage for things like keeping you signed in and remembering whether you\'ve seen a one-time announcement — not for third-party advertising or cross-site tracking.',
      ],
    },
    {
      heading: '7. Your choices',
      paragraphs: [
        'You can ask us to access, correct, or delete your personal data at any time by emailing support@vidyabandham.com. For school-managed student data, please contact your school directly, since they control those records.',
      ],
    },
    {
      heading: '8. Changes to this policy',
      paragraphs: [
        'We may update this policy as the Platform evolves. We\'ll post the revised version here with an updated date.',
      ],
    },
    {
      heading: '9. Contact',
      paragraphs: [
        'Questions about your data? Reach us at support@vidyabandham.com or call 8884099770 / 9030523776.',
      ],
    },
  ],
};

const REFUND: PolicyContent = {
  title: 'Refund & Cancellation Policy',
  updated: 'Last updated: September 2026',
  sections: [
    {
      heading: '1. Free papers',
      paragraphs: [
        'A limited number of TET 2026 practice papers are free to attempt in full, permanently, with no payment involved — there\'s nothing to refund or cancel there.',
      ],
    },
    {
      heading: '2. Paid subscriptions',
      paragraphs: [
        'Once a payment is successfully processed and a subscription is activated, granting access to the paid practice papers, that payment is generally non-refundable — the same as most digital content and exam-prep products, since the content becomes accessible immediately.',
      ],
    },
    {
      heading: '3. When a refund does apply',
      paragraphs: [
        'If a payment was deducted from your account but your subscription was not activated (a technical or gateway failure), or you were charged more than once for the same subscription by mistake, you\'re entitled to a full refund of the incorrect/failed charge. Contact us with your payment ID (shown in your Razorpay confirmation email/SMS) and we\'ll verify and process it.',
      ],
    },
    {
      heading: '4. How to request a refund',
      paragraphs: [
        'Email support@vidyabandham.com (or call 8884099770 / 9030523776) with your registered email, the payment/order ID, and a short description of the issue. We aim to respond within 2–3 business days.',
      ],
    },
    {
      heading: '5. Processing time',
      paragraphs: [
        'Approved refunds are issued back to the original payment method via Razorpay. Depending on your bank or payment provider, this typically takes 5–7 business days to reflect, though this is set by the payment networks and banks involved, not by us.',
      ],
    },
    {
      heading: '6. Contact',
      paragraphs: [
        'Questions about a payment? Reach us at support@vidyabandham.com or call 8884099770 / 9030523776.',
      ],
    },
  ],
};

@Component({
  selector: 'app-policy-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="policy-page">
      <div class="policy-card">
        <a routerLink="/login" class="back-link">← Back to Vidya Bandham</a>
        <h1>{{ content.title }}</h1>
        <p class="updated">{{ content.updated }}</p>

        <section *ngFor="let section of content.sections">
          <h2>{{ section.heading }}</h2>
          <p *ngFor="let para of section.paragraphs">{{ para }}</p>
        </section>

        <div class="policy-links">
          <a routerLink="/terms" [class.active]="isActive('terms')">Terms &amp; Conditions</a>
          <span>·</span>
          <a routerLink="/privacy" [class.active]="isActive('privacy')">Privacy Policy</a>
          <span>·</span>
          <a routerLink="/refund-policy" [class.active]="isActive('refund-policy')">Refund &amp; Cancellation</a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .policy-page {
        min-height: 100vh;
        display: flex;
        justify-content: center;
        padding: 2.5rem 1rem;
        background: linear-gradient(135deg, #eef1f6 0%, #f4f1ea 55%, #fdf2e3 100%);
        font-family: system-ui, sans-serif;
        box-sizing: border-box;
      }
      .policy-card {
        width: 100%;
        max-width: 720px;
        background: white;
        border-radius: 14px;
        padding: 2rem 2.25rem 2.5rem;
        box-shadow: 0 10px 30px rgba(44, 72, 112, 0.1);
        box-sizing: border-box;
      }
      .back-link {
        display: inline-block;
        margin-bottom: 1.25rem;
        color: #2c4870;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.9rem;
      }
      .back-link:hover {
        text-decoration: underline;
      }
      h1 {
        margin: 0 0 0.25rem;
        color: #2c4870;
      }
      .updated {
        color: #888;
        font-size: 0.85rem;
        margin: 0 0 1.75rem;
      }
      h2 {
        color: #c97c1f;
        font-size: 1.05rem;
        margin: 1.6rem 0 0.5rem;
      }
      p {
        line-height: 1.6;
        color: #333;
        margin: 0 0 0.75rem;
        font-size: 0.95rem;
      }
      .policy-links {
        margin-top: 2.5rem;
        padding-top: 1.25rem;
        border-top: 1px solid #eee;
        text-align: center;
        font-size: 0.85rem;
        color: #999;
      }
      .policy-links a {
        color: #2c4870;
        text-decoration: none;
        font-weight: 600;
        margin: 0 0.4rem;
      }
      .policy-links a.active {
        color: #c97c1f;
        text-decoration: underline;
      }
      .policy-links span {
        color: #ccc;
      }
    `,
  ],
})
export class PolicyPageComponent {
  content: PolicyContent;

  constructor(private route: ActivatedRoute) {
    const routePath = this.route.snapshot.routeConfig?.path;
    switch (routePath) {
      case 'privacy':
        this.content = PRIVACY;
        break;
      case 'refund-policy':
        this.content = REFUND;
        break;
      case 'terms':
      default:
        this.content = TERMS;
        break;
    }
  }

  isActive(path: string): boolean {
    return this.route.snapshot.routeConfig?.path === path;
  }
}
