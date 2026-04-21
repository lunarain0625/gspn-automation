export const APP_CONFIG = {
    port: process.env.PORT || 3001,
    spreadsheetId: process.env.SPREADSHEET_ID || '1cKxpTqnBsMwG6UlEQXjh-QAIFdhETLRfoqnEbMlixe4',
    sheets: {
        phone: 'GSPN Phone Price',
        tab: 'GSPN Tab Price',
        buds: 'GSPN Buds Price'
    }
};
