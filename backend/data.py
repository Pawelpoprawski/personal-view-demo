"""Dummy data for the Insights Platform demo. All people, clients and numbers are fictional."""

ADVISOR = {"name": "Josh", "full_name": "Josh Miller", "desk": "Wealth Management, Zurich"}

CLIENTS = [
    {
        "id": 1, "name": "John Smith", "segment": "UHNW",
        "booking_location": "Zurich", "domicile": "CH",
        "aum_musd": 182.0, "share_of_wallet_pct": 34,
        "revenue_ytd_kusd": 1240, "nnm_ytd_musd": 7.9,
        "engagement_score": 7, "last_interaction_days": 12,
        "tags": ["Entrepreneur", "Technology / AI Interest", "Growth Priority"],
        "allocation": {"Equities": 42, "Fixed Income": 28, "Alternatives": 18, "Cash": 12},
        "liabilities": {"Loans": 24.0, "Mortgages": 8.5},
    },
    {
        "id": 2, "name": "Mark Johnson", "segment": "UHNW",
        "booking_location": "Geneva", "domicile": "UK",
        "aum_musd": 96.5, "share_of_wallet_pct": 21,
        "revenue_ytd_kusd": 640, "nnm_ytd_musd": -1.2,
        "engagement_score": 4, "last_interaction_days": 96,
        "tags": ["Next-Gen Decision Maker", "Selective on Meetings"],
        "allocation": {"Equities": 55, "Fixed Income": 20, "Alternatives": 10, "Cash": 15},
        "liabilities": {"Loans": 12.0, "Mortgages": 0.0},
    },
    {
        "id": 3, "name": "James Brown", "segment": "UHNW",
        "booking_location": "Zurich", "domicile": "DE",
        "aum_musd": 143.2, "share_of_wallet_pct": 45,
        "revenue_ytd_kusd": 980, "nnm_ytd_musd": 3.2,
        "engagement_score": 6, "last_interaction_days": 91,
        "tags": ["Liquidity Event 2025", "Growth Priority"],
        "allocation": {"Equities": 35, "Fixed Income": 40, "Alternatives": 15, "Cash": 10},
        "liabilities": {"Loans": 18.5, "Mortgages": 12.0},
    },
    {
        "id": 4, "name": "Emma Davis", "segment": "HNW",
        "booking_location": "London", "domicile": "UK",
        "aum_musd": 58.7, "share_of_wallet_pct": 62,
        "revenue_ytd_kusd": 410, "nnm_ytd_musd": 1.6,
        "engagement_score": 9, "last_interaction_days": 5,
        "tags": ["Entrepreneur", "Next-Gen Decision Maker"],
        "allocation": {"Equities": 48, "Fixed Income": 22, "Alternatives": 20, "Cash": 10},
        "liabilities": {"Loans": 6.0, "Mortgages": 4.2},
    },
    {
        "id": 5, "name": "Robert Wilson", "segment": "UHNW",
        "booking_location": "Zurich", "domicile": "CH",
        "aum_musd": 42.6, "share_of_wallet_pct": 18,
        "revenue_ytd_kusd": 230, "nnm_ytd_musd": 1.1,
        "engagement_score": 5, "last_interaction_days": 34,
        "tags": ["Technology / AI Interest"],
        "allocation": {"Equities": 30, "Fixed Income": 35, "Alternatives": 5, "Cash": 30},
        "liabilities": {"Loans": 0.0, "Mortgages": 2.8},
    },
]

# My Financials — book-level tiles (deltas vs. previous quarter)
FINANCIALS = {
    "tiles": [
        {"key": "aum",       "label": "Assets Under Management", "value_musd": 523.0, "delta_musd": 7.9,  "direction": "up"},
        {"key": "nnm",       "label": "Net New Money",           "value_musd": 12.6,  "delta_musd": 3.2,  "direction": "up"},
        {"key": "nnl",       "label": "Net New Loans",           "value_musd": 4.4,   "delta_musd": 1.6,  "direction": "up"},
        {"key": "nnfga",     "label": "Net New Fee Gen Assets",  "value_musd": 8.1,   "delta_musd": -1.2, "direction": "down"},
        {"key": "revenue",   "label": "Overall Revenue",         "value_musd": 26.5,  "delta_musd": 1.1,  "direction": "up"},
    ],
    # book-level asset allocation for the donut
    "allocation": [
        {"class": "Equities",     "pct": 44, "musd": 230.1},
        {"class": "Fixed Income", "pct": 28, "musd": 146.4},
        {"class": "Alternatives", "pct": 15, "musd": 78.5},
        {"class": "Cash",         "pct": 13, "musd": 68.0},
    ],
    "liabilities": [
        {"type": "Loans",     "musd": 60.5},
        {"type": "Mortgages", "musd": 27.5},
    ],
}

# My Actions (landing page)
ACTIONS = [
    {"id": 1, "title": "Engage with client James Brown", "client_id": 3,
     "note": "You have not interacted with the client for the last 90 days.",
     "detail": "Reach out to the client and discuss any recent developments of their portfolio.",
     "due": "2026-07-18", "status": "Open", "priority": "high"},
    {"id": 2, "title": "Quarterly portfolio review", "client_id": 1,
     "note": "Q2 review not yet scheduled.",
     "detail": "Schedule the Q2 review meeting and prepare the performance summary.",
     "due": "2026-07-22", "status": "Open", "priority": "medium"},
    {"id": 3, "title": "Follow up on Lombard proposal", "client_id": 2,
     "note": "Proposal sent 14 days ago, no response.",
     "detail": "Call the client to walk through the terms of the Lombard facility.",
     "due": "2026-07-16", "status": "Open", "priority": "high"},
    {"id": 4, "title": "Update KYC documentation", "client_id": 5,
     "note": "Periodic review due this month.",
     "detail": "Collect the updated source-of-wealth documentation.",
     "due": "2026-07-30", "status": "Completed", "priority": "low"},
]

# My Engagement
ENGAGEMENT = {
    "tiles": [
        {"label": "Client Engagement Score", "value": "6.2", "sub": "avg. across book, out of 10"},
        {"label": "Interactions per Client", "value": "4.8", "sub": "last 90 days"},
        {"label": "Specialist Engagement", "value": "38%", "sub": "clients met a specialist this year"},
    ],
    "interactions": [
        {"client_id": 4, "type": "Meeting",  "subject": "Succession planning with next generation", "date": "2026-07-09", "with_specialist": True},
        {"client_id": 1, "type": "Call",     "subject": "Tech sector exposure and AI basket idea",   "date": "2026-07-02", "with_specialist": False},
        {"client_id": 5, "type": "Email",    "subject": "Cash deployment options",                   "date": "2026-06-10", "with_specialist": False},
        {"client_id": 3, "type": "Meeting",  "subject": "Annual review",                             "date": "2026-04-14", "with_specialist": True},
        {"client_id": 2, "type": "Call",     "subject": "Lombard facility terms",                    "date": "2026-04-09", "with_specialist": False},
    ],
}

# My Opportunities
OPPORTUNITIES = [
    {"id": 1, "client_id": 1, "product": "Global Markets", "title": "AI thematic basket",
     "estimated_value_musd": 15.0, "potential_score": 8, "status": "Open",
     "lead": "Sarah Keller", "updated": "2026-07-10",
     "rationale": "Strong stated interest in technology and AI; equity allocation has room within the risk profile."},
    {"id": 2, "client_id": 3, "product": "Global Lending", "title": "Lombard facility extension",
     "estimated_value_musd": 10.0, "potential_score": 7, "status": "In Review",
     "lead": "Marco Ricci", "updated": "2026-07-08",
     "rationale": "Upcoming liquidity event in 2025 vintage fund; bridge financing need likely."},
    {"id": 3, "client_id": 2, "product": "Global Banking", "title": "Pre-IPO advisory",
     "estimated_value_musd": 25.0, "potential_score": 6, "status": "Open",
     "lead": "Sarah Keller", "updated": "2026-07-01",
     "rationale": "Family business exploring a listing; next-gen decision maker leading the process."},
    {"id": 4, "client_id": 4, "product": "Global Alternatives", "title": "Private equity feeder",
     "estimated_value_musd": 5.0, "potential_score": 9, "status": "Open",
     "lead": "Anna Weber", "updated": "2026-06-28",
     "rationale": "Alternatives allocation below target; client asked for PE track record last meeting."},
    {"id": 5, "client_id": 5, "product": "Prime Brokerage", "title": "Custody consolidation",
     "estimated_value_musd": 12.0, "potential_score": 4, "status": "Closed",
     "lead": "Marco Ricci", "updated": "2026-05-20",
     "rationale": "Client decided to keep assets with the current custodian for now."},
]

OPPORTUNITY_STATUSES = ["Open", "In Review", "Closed"]

# Client news (landing page) — all headlines fictional
NEWS = [
    {"id": 1, "client_id": 1, "date": "2026-07-11",
     "headline": "Smith Industries announces acquisition of a robotics startup",
     "source": "Market wire"},
    {"id": 2, "client_id": 3, "date": "2026-07-09",
     "headline": "Brown family fund closes 2025 vintage above target",
     "source": "PE newsletter"},
    {"id": 3, "client_id": 2, "date": "2026-07-05",
     "headline": "Johnson Group appoints new CFO ahead of possible listing",
     "source": "Financial daily"},
    {"id": 4, "client_id": 4, "date": "2026-06-30",
     "headline": "Davis Ventures leads Series B in a climate-tech company",
     "source": "VC digest"},
]
