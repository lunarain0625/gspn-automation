const STATE_MAPPING = {
    ACT: 'Aust Capital Terr',
    'AUSTRALIAN CAPITAL TERRITORY': 'Aust Capital Terr',
    'AUST CAPITAL TERR': 'Aust Capital Terr',

    NSW: 'New South Wales',
    'NEW SOUTH WALES': 'New South Wales',

    NT: 'Northern Territory',
    'NORTHERN TERRITORY': 'Northern Territory',

    QLD: 'Queensland',
    QUEENSLAND: 'Queensland',

    SA: 'South Australia',
    'SOUTH AUSTRALIA': 'South Australia',

    TAS: 'Tasmania',
    TASMANIA: 'Tasmania',

    VIC: 'Victoria',
    VICTORIA: 'Victoria',

    WA: 'Western Australia',
    'WESTERN AUSTRALIA': 'Western Australia',

    NZ: 'NEW ZEALAND',
    'NEW ZEALAND': 'NEW ZEALAND'
};

export function formatGspnDate(date) {
    if (!date) {
        return '';
    }

    // GSPN automation browser expects dd.MM.yyyy format.
    return date.toString().trim().replaceAll('/', '.');
}

export function normalizeState(state) {
    if (!state) {
        return '';
    }

    const normalized = state
        .toString()
        .trim()
        .toUpperCase();

    return STATE_MAPPING[normalized] || state;
}

export function normalizePhone(phone) {
    if (!phone) {
        return '';
    }

    let normalized = phone.toString().replace(/\D/g, '');

    // Convert Australian mobile international format to local format.
    if (normalized.startsWith('61')) {
        normalized = `0${normalized.slice(2)}`;
    }

    // Ensure local mobile numbers start with 0.
    if (normalized.length === 9 && !normalized.startsWith('0')) {
        normalized = `0${normalized}`;
    }

    return normalized;
}
