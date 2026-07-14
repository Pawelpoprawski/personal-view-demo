"""Dummy data for the demo app. All names, numbers and emails are fictional."""

USERS = {
    "anna": {
        "password": "advisor123",
        "name": "Anna Kowalska",
        "role": "Client Advisor",
        "advisor_id": "CA-001",
    },
    "marek": {
        "password": "advisor123",
        "name": "Marek Nowak",
        "role": "Client Advisor",
        "advisor_id": "CA-002",
    },
    "boss": {
        "password": "manager123",
        "name": "Julia Wiśniewska",
        "role": "Management",
        "advisor_id": None,
    },
    "spec": {
        "password": "spec123",
        "name": "Tomasz Zieliński",
        "role": "Specialist",
        "advisor_id": None,
    },
}

# One default demo account per role (used by the role buttons on the start page)
ROLE_DEFAULT_USER = {
    "Client Advisor": "anna",
    "Specialist": "spec",
    "Management": "boss",
}

CLIENTS = [
    {"id": 1, "name": "Alpha Holdings",    "advisor_id": "CA-001", "segment": "UHNW", "domicile": "CH", "invested_assets_musd": 125.4, "cash_musd": 12.1, "revenue_ytd_kusd": 842,  "nnm_ytd_musd": 8.4,  "ytd_return_pct": 6.2, "risk_profile": "Balanced",     "mandate": "Advisory",      "needs_review": True,  "open_products": ["Lombard Loan", "FX Hedge"]},
    {"id": 2, "name": "Beta Family Office","advisor_id": "CA-001", "segment": "UHNW", "domicile": "DE", "invested_assets_musd": 310.0, "cash_musd": 25.7, "revenue_ytd_kusd": 1930, "nnm_ytd_musd": -4.2, "ytd_return_pct": 4.8, "risk_profile": "Conservative", "mandate": "Discretionary", "needs_review": False, "open_products": ["Discretionary Mandate"]},
    {"id": 3, "name": "Gamma Ventures",    "advisor_id": "CA-001", "segment": "HNW",  "domicile": "PL", "invested_assets_musd": 42.7,  "cash_musd": 3.9,  "revenue_ytd_kusd": 388,  "nnm_ytd_musd": 5.1,  "ytd_return_pct": 9.1, "risk_profile": "Aggressive",   "mandate": "Advisory",      "needs_review": True,  "open_products": ["Structured Note", "Private Equity"]},
    {"id": 4, "name": "Delta Trust",       "advisor_id": "CA-002", "segment": "HNW",  "domicile": "CH", "invested_assets_musd": 58.3,  "cash_musd": 6.4,  "revenue_ytd_kusd": 421,  "nnm_ytd_musd": 2.0,  "ytd_return_pct": 3.5, "risk_profile": "Balanced",     "mandate": "Advisory",      "needs_review": False, "open_products": ["Advisory Mandate"]},
    {"id": 5, "name": "Epsilon Capital",   "advisor_id": "CA-002", "segment": "UHNW", "domicile": "UK", "invested_assets_musd": 201.9, "cash_musd": 18.3, "revenue_ytd_kusd": 1544, "nnm_ytd_musd": 11.9, "ytd_return_pct": 7.7, "risk_profile": "Aggressive",   "mandate": "Discretionary", "needs_review": True,  "open_products": ["Lombard Loan", "Structured Note"]},
    {"id": 6, "name": "Zeta Foundation",   "advisor_id": "CA-002", "segment": "HNW",  "domicile": "AT", "invested_assets_musd": 19.6,  "cash_musd": 1.2,  "revenue_ytd_kusd": 96,   "nnm_ytd_musd": 0.4,  "ytd_return_pct": 2.1, "risk_profile": "Conservative", "mandate": "Execution only", "needs_review": False, "open_products": []},
]

# Sales / product proposals worked on by Specialists.
# Specialists can edit: status, expected_volume_musd, comment.
PROPOSALS = [
    {"id": 1, "client_id": 1, "product": "FX Hedge rollover",        "rationale": "Existing hedge expires in Q3, high FX exposure (USD/CHF).",   "status": "New",         "expected_volume_musd": 15.0, "comment": ""},
    {"id": 2, "client_id": 3, "product": "Private Equity feeder",    "rationale": "Aggressive profile, low alternatives allocation (4%).",       "status": "In progress", "expected_volume_musd": 5.0,  "comment": "Client asked for track record."},
    {"id": 3, "client_id": 5, "product": "Structured Note (SMI)",    "rationale": "Note matured last month, proceeds sitting in cash.",          "status": "New",         "expected_volume_musd": 10.0, "comment": ""},
    {"id": 4, "client_id": 2, "product": "Sustainable bond mandate", "rationale": "Family office requested ESG tilt in last review.",            "status": "Proposed",    "expected_volume_musd": 25.0, "comment": "Waiting for IC approval."},
    {"id": 5, "client_id": 5, "product": "Lombard limit increase",   "rationale": "Utilisation at 92% of current limit.",                        "status": "New",         "expected_volume_musd": 8.0,  "comment": ""},
    {"id": 6, "client_id": 4, "product": "Retirement planning",      "rationale": "Beneficial owner turns 60 next year.",                        "status": "Declined",    "expected_volume_musd": 0.0,  "comment": "Client covered externally."},
]

PROPOSAL_STATUSES = ["New", "In progress", "Proposed", "Won", "Declined"]
