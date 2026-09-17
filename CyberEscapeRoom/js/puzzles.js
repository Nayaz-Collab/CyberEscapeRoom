/* ============================================
   PUZZLES.JS — puzzle data, hints, validators
   ============================================ */

const Puzzles = {

  room1: {
    cipherText: 'KHOOR ZRUOG',
    answer: 'HELLO WORLD',
    cipherTypeAnswer: 'caesar',
    hints: [
      'Each letter in the message has simply been shifted forward in the alphabet by a fixed amount.',
      'Try shifting every letter BACK by 3 positions (D→A, E→B, F→C...).',
      'K-3=H, H-3=E, O-3=L, O-3=L, R-3=O → the first word is "HELLO".'
    ]
  },

  room2: {
    email: {
      from: 'security@paypa1-support.com',
      subject: 'URGENT: Your account will be suspended in 24 hours!',
      body:
`Dear Valued Customer,

We detected unusual activity on your account. Your account
will be permanently SUSPENDED within 24 hours unless you
verify your information immediately.

Click here to verify now: http://paypa1-verify-account.com/login

Failure to act will result in permanent loss of access to
your funds.

Sincerely,
PayPal Security Team`
    },
    isPhishing: true,
    // indices of the checkbox options that ARE genuine red flags
    correctIndicators: [0, 1, 2, 3, 4],
    indicators: [
      { text: 'Sender domain "paypa1-support.com" uses a zero instead of the letter L', correct: true },
      { text: 'Creates false urgency ("24 hours", "suspended")', correct: true },
      { text: 'Generic greeting ("Dear Valued Customer") instead of your name', correct: true },
      { text: 'Suspicious link domain that is not the real company site', correct: true },
      { text: 'Threatens loss of funds/access to pressure quick action', correct: true },
      { text: 'The email uses proper company letterhead, so it must be safe', correct: false }
    ],
    hints: [
      'Look closely at the sender\'s email domain — is it spelled exactly like the real company?',
      'Legitimate companies rarely threaten to suspend your account within 24 hours over email.',
      'Hover-worthy links, urgency, generic greetings, and scare tactics are the classic phishing combo.'
    ]
  },

  room3: {
    shownPassword: 'Admin123',
    hints: [
      'A strong password needs more than just one uppercase letter and a few digits — think length first.',
      'Aim for 12+ characters, mixing upper/lowercase, numbers, AND symbols, with no common words.',
      'Avoid dictionary words like "Admin" entirely — a password manager-generated passphrase is ideal.'
    ],
    // returns {score: 0-4, label, color}
    scorePassword(pw){
      if(!pw) return { score:0, label:'EMPTY', color:'#ff3b3b' };
      let score = 0;
      if(pw.length >= 8) score++;
      if(pw.length >= 12) score++;
      if(/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
      if(/[0-9]/.test(pw)) score++;
      if(/[^A-Za-z0-9]/.test(pw)) score++;
      const common = ['password','admin123','admin','123456','qwerty','letmein'];
      if(common.includes(pw.toLowerCase())) score = 0;

      const levels = [
        { label:'VERY WEAK',  color:'#ff3b3b' },
        { label:'WEAK',       color:'#ff3b3b' },
        { label:'FAIR',       color:'#ffb000' },
        { label:'STRONG',     color:'#33ff66' },
        { label:'VERY STRONG',color:'#33ff66' },
        { label:'VERY STRONG',color:'#33ff66' }
      ];
      return Object.assign({ score }, levels[Math.min(score, levels.length-1)]);
    }
  },

  room4: {
    vulnerableCode: `String query = "SELECT * FROM users WHERE username='" + username + "'";`,
    // multiple choice: what is the vulnerability
    vulnQuestion: 'What type of vulnerability is present in this code?',
    vulnOptions: [
      'Cross-Site Scripting (XSS)',
      'SQL Injection',
      'Buffer Overflow',
      'Insecure Direct Object Reference'
    ],
    vulnAnswerIndex: 1,
    // multiple choice: what is the correct fix
    fixQuestion: 'Which fix correctly secures this code?',
    fixOptions: [
      `String query = "SELECT * FROM users WHERE username='" + escape(username) + "'";`,
      `PreparedStatement stmt = conn.prepareStatement("SELECT * FROM users WHERE username=?"); stmt.setString(1, username);`,
      `String query = "SELECT * FROM users WHERE username='" + username.replace("'","") + "'";`,
      `query = "SELECT * FROM users"; // fetch all and filter in Java`
    ],
    fixAnswerIndex: 1,
    hints: [
      'The username is concatenated directly into the SQL string — what could a user type instead of a name?',
      'An attacker could input something like  \' OR \'1\'=\'1  to manipulate the query logic.',
      'The fix separates code from data completely, using placeholders (?) that are bound safely — that\'s a prepared statement.'
    ]
  },

  room5: {
    logText:
`192.168.1.10 - - [11/Jul/2026:02:14:01] "GET /login HTTP/1.1" 200
203.0.113.77 - - [11/Jul/2026:02:15:03] "POST /login HTTP/1.1" 401
203.0.113.77 - - [11/Jul/2026:02:15:05] "POST /login HTTP/1.1" 401
203.0.113.77 - - [11/Jul/2026:02:15:07] "POST /login HTTP/1.1" 401
203.0.113.77 - - [11/Jul/2026:02:15:09] "POST /login HTTP/1.1" 401
203.0.113.77 - - [11/Jul/2026:02:15:11] "POST /login HTTP/1.1" 401
203.0.113.77 - - [11/Jul/2026:02:15:14] "POST /login HTTP/1.1" 200
192.168.1.14 - - [11/Jul/2026:02:16:40] "GET /dashboard HTTP/1.1" 200`,
    attackerIp: '203.0.113.77',
    failedAttempts: 5,
    attackStart: '02:15:03',
    hints: [
      'Focus on the IP address that repeats with failed (401) status codes.',
      'Count only the lines from that IP that end in a 401 response code.',
      'The attack "starts" at the timestamp of the FIRST failed attempt from that IP.'
    ]
  },

  room6: {
    urls: [
      { url: 'https://www.amazon.com/orders', suspicious: false },
      { url: 'http://amaz0n-security-verify.com/login', suspicious: true },
      { url: 'https://accounts.google.com/signin', suspicious: false },
      { url: 'http://paypaI-login-secure.com/account', suspicious: true },
      { url: 'https://mybank-secure-update.net/verify-now', suspicious: true }
    ],
    hints: [
      'Real brand domains almost always end exactly at the well-known root domain — check letter-for-letter.',
      'Watch for lookalike characters: a capital "I" instead of lowercase "l", or a zero instead of "o".',
      'Extra words like "-secure", "-verify", or "-update" bolted onto an unfamiliar domain are a red flag, as is plain http:// instead of https://.'
    ]
  }
};
