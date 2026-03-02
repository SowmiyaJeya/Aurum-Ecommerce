import '../styles/Auth.css'

// Returns 0–4 score based on password complexity
function getScore(pw) {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 6)  score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(score, 4)
}

const COLORS = ['', '#e07a5f', '#f2a93b', '#6abf69', '#1a6b6b']
const LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']

export default function PasswordStrength({ password }) {
  const score = getScore(password)

  return (
    <div>
      {/* 4-segment bar */}
      <div className="strengthBar">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="strengthSeg"
            style={{ background: i <= score ? COLORS[score] : undefined }}
          />
        ))}
      </div>

      {/* Strength label */}
      {score > 0 && (
        <div className="strengthLabel" style={{ color: COLORS[score] }}>
          {LABELS[score]}
        </div>
      )}
    </div>
  )
}
