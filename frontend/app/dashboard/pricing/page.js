'use client'

import styles from './pricing.module.css'

export default function PricingPage() {
  const plans = [
    { 
      name: 'Free Trial', 
      price: '₹0', 
      duration: '7 days', 
      plan: 'free',
      perks: [
        '✔ Access to basic video processing',
        '✔ Limited report downloads',
        '✔ GeoServer map preview',
        '✘ No shareable links',
        '✘ No priority support'
      ]
    },
    { 
      name: '3 Months', 
      price: '₹999', 
      duration: '3 months', 
      plan: '3_months',
      perks: [
        '✔ Unlimited video uploads',
        '✔ Detailed CSV reports',
        '✔ Shareable processed video links',
        '✔ Priority email support',
        '✘ No custom branding'
      ]
    },
    { 
      name: '1 Year', 
      price: '₹2999', 
      duration: '12 months', 
      plan: '12_months',
      perks: [
        '✔ Unlimited everything',
        '✔ Advanced analytics & insights',
        '✔ Shareable & embeddable links',
        '✔ Premium 24/7 support',
        '✔ Custom branding'
      ]
    },
  ]

  const handleClick = (plan) => {
    alert(`You selected the ${plan} plan (dummy action for now).`)
  }

  return (
    <div className={styles.pageWrapper}>
      <h1 className={styles.title}>Choose Your Plan</h1>
      <div className={styles.plansGrid}>
        {plans.map((p) => (
          <div key={p.plan} className={styles.planCard}>
            <h2>{p.name}</h2>
            <p className={styles.price}>{p.price}</p>
            <p className={styles.duration}>{p.duration}</p>

            {/* ✅ Add perks here */}
            <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0', textAlign: 'left', color: '#cbd5e1' }}>
              {p.perks.map((perk, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem' }}>{perk}</li>
              ))}
            </ul>

            <button className={styles.subscribeBtn} onClick={() => handleClick(p.name)}>
              Select
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
