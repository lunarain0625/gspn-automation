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
    console.log('Formatting date for GSPN:', date, ' => ', date.toString().trim().replaceAll('/', '.'));
    // GSPN automation browser expects dd.MM.yyyy format.
    return date.toString().trim().replaceAll('/', '.');
}

export function normalizeWarrantyResult(raw) {
    const value = (raw || '').toString().trim().toUpperCase();
    if (value === 'LP') return 'IW'; // Legacy: LP = IW
    if (value === 'OW') return 'OW';
    return '';
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

// SRC516-LOCK：管理员要在 GSPN 手工走 unlock 流程，这类单子的保修豁免和
// ASC job no 都跟普通维修不一样，判断散在 create-job 和 update-job 两处，放这里共用。
export const PHONE_LOCK_SYMPTOM_CODE = 'SRC516';

export function isPhoneLockCase(data) {
    return data?.irisSymptQcode === PHONE_LOCK_SYMPTOM_CODE;
}
