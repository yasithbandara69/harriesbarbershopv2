import styles from './Terms.module.css';

export default function TermsPage() {
  return (
    <main className={styles.container}>
      <div className={styles.contentWrapper}>
        <h1 className={styles.title}>Direct Debit Terms and Conditions</h1>
        <p className={styles.subtitle}>Harries Barbershop Pty Ltd | ABN 48 679 644 743</p>
        
        <p className={styles.text}>
          These terms apply to both the Haircut and Haircut + Beard memberships. By clicking "Join Now" and providing your payment details, you agree to the terms below and authorise Harries Barbershop Pty Ltd (ABN 48 679 644 743) to debit your nominated card or bank account on a recurring monthly basis via our payment processor, Stripe.
        </p>

        <div className={styles.divider} />

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Your direct debit authority</h2>
          <p className={styles.text}>
            When you sign up for a Loyalty Membership, you give Harries Barbershop Pty Ltd standing authority to debit your nominated payment method (credit card, debit card, or bank account, as supported by Stripe) for the applicable monthly membership fee, on the same calendar date each month as your original sign-up date.
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>If your billing date falls on a date that doesn't exist in a given month (e.g. the 31st), you will be debited on the last day of that month instead.</li>
            <li className={styles.listItem}>Your payment details are collected and stored securely by Stripe, our third-party payment processor. Harries Barbershop does not store your full card or bank account details.</li>
            <li className={styles.listItem}>You confirm that you are either the account holder or an authorised signatory for the payment method provided, and that you have the authority to set up this recurring debit.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Billing cycle and renewal</h2>
          <p className={styles.text}>
            Your membership is billed monthly in advance and renews automatically at the end of each cycle unless you cancel in accordance with Section 5 below. There is no fixed contract term — memberships continue month to month until cancelled by you or terminated by us.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Failed or declined payments</h2>
          <p className={styles.text}>
            If a scheduled direct debit fails (for example, due to insufficient funds, an expired card, or a bank decline), the following process applies:
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>We will attempt to process the payment again automatically. Stripe's standard retry schedule applies, typically up to 3 attempts over 7 days.</li>
            <li className={styles.listItem}>We will notify you by email or SMS after the first failed attempt, asking you to update your payment details if needed.</li>
            <li className={styles.listItem}>Your membership credits will be placed on hold and bookings restricted until payment is successfully collected.</li>
            <li className={styles.listItem}>If payment cannot be collected after all retry attempts, we may suspend or cancel your membership, and any outstanding balance may still be payable.</li>
            <li className={styles.listItem}>Any bank or card fees charged to you as a result of a failed or declined payment are your responsibility, not ours.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Changes to your membership or these terms</h2>
          <p className={styles.text}>
            We may vary the monthly fee, the number of credits included, or these terms and conditions from time to time. Where a change may reasonably affect you (such as a price increase), we will give you at least 14 days' written notice by email before the change takes effect.
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>If you do not agree to a price or term change, you may cancel your membership before the change takes effect, in accordance with Section 5, without penalty.</li>
            <li className={styles.listItem}>Continuing your membership after the notice period ends is treated as acceptance of the updated terms.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Cancelling or pausing your membership</h2>
          <p className={styles.text}>
            You may cancel or request to pause your membership at any time by notifying us in writing (email or in person) or through your account, giving at least 14 days' notice before your next billing date.
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>If we receive your cancellation or pause request less than 14 days before your next billing date, that month's payment will still be processed, and cancellation will take effect from the following cycle.</li>
            <li className={styles.listItem}>No partial refunds are given for the remainder of a billing cycle in which you cancel.</li>
            <li className={styles.listItem}>Any unused credits at the time of cancellation are forfeited, consistent with the "credits do not roll over" policy on each plan.</li>
            <li className={styles.listItem}>Paused memberships retain your membership pricing but do not accrue credits or charges while paused, for a maximum pause period of 60 days, after which the membership will either resume or be treated as cancelled.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Our right to cancel or suspend</h2>
          <p className={styles.text}>
            We may suspend or cancel your membership, with reasonable notice where practical, if: payments repeatedly fail; you breach these terms; there is suspected fraudulent or abusive use of credits; or we cease offering the membership program. Where we cancel without cause, we will refund any amount already charged for services not yet provided.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Disputes and incorrect charges</h2>
          <p className={styles.text}>
            If you believe you have been charged in error, contact us first at the details below so we can investigate and resolve it directly — most issues can be fixed within a few business days.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Privacy</h2>
          <p className={styles.text}>
            Your payment information is handled by Stripe in accordance with Stripe's privacy and security standards (including PCI-DSS compliance). Harries Barbershop retains only the information necessary to manage your membership, such as your name, contact details, and credit balance, and will not share your data with third parties except as required to process payments or comply with the law.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Contact and questions</h2>
          <p className={styles.text}>
            For any questions about your membership, billing, or these terms, contact Harries Barbershop Pty Ltd directly in-store or via the contact details provided on our website. We're happy to walk through your billing history or membership status at any time.
          </p>
        </section>

        <div className={styles.footer}>
          <p>Harries Barbershop Pty Ltd — ABN 48 679 644 743</p>
          <p>Loyalty Membership Terms and Conditions, effective 5 August 2026.</p>
        </div>
      </div>
    </main>
  );
}
