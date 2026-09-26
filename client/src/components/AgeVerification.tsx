import { useEffect, useState } from 'react'

const AGE_VERIFIED_KEY = 'exotica_age_verified'

export default function AgeVerification() {
  const [showPopup, setShowPopup] = useState(false)
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    const verified = localStorage.getItem(AGE_VERIFIED_KEY)

    if (verified !== 'true') {
      setShowPopup(true)
    }
  }, [])

  const handleYes = () => {
    localStorage.setItem(AGE_VERIFIED_KEY, 'true')
    setShowPopup(false)
  }

  const handleNo = () => {
    setBlocked(true)
  }

  if (!showPopup) {
    return null
  }

  return (
    <div className="age-overlay">
      <div className="age-popup">
        {!blocked ? (
          <>
            <div className="age-icon">18+</div>

            <p className="age-label">
              EXOTICA
            </p>

            <h2>Are you 18 or older?</h2>

            <p className="age-text">
              You must be 18 years or older to access
              Exotica and its products.
            </p>

            <div className="age-actions">
              <button
                type="button"
                className="age-yes"
                onClick={handleYes}
              >
                Yes, I'm 18+
              </button>

              <button
                type="button"
                className="age-no"
                onClick={handleNo}
              >
                No, I'm under 18
              </button>
            </div>

            <p className="age-note">
              By entering this website, you confirm that
              you are at least 18 years old.
            </p>
          </>
        ) : (
          <>
            <div className="age-icon">18+</div>

            <p className="age-label">
              EXOTICA
            </p>

            <h2>Access Restricted</h2>

            <p className="age-text">
              Sorry, you must be 18 years or older to
              access this website.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
