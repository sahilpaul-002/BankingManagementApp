export interface ExpenditureChartItemType {
    date: string;

    amount: string;
}

export interface CardExpenditureChartResponseDataType {
    currency: string;

    total_card_spend: string;

    card_spend: ExpenditureChartItemType[];
}

export interface CardExpenditureChartResponseType {
    status: string;

    message: string;

    data: CardExpenditureChartResponseDataType;
}

export interface PayoutExpenditureChartResponseDataType {
    currency: string;

    total_payout_spend: string;

    payout_spend: ExpenditureChartItemType[];
}

export interface PayoutExpenditureChartResponseType {
    status: string;

    message: string;

    data: PayoutExpenditureChartResponseDataType;
}