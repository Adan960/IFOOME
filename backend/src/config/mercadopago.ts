const mercadopago = require("mercadopago");
const { MercadoPagoConfig, Preference } = mercadopago;

const client = new MercadoPagoConfig({
    accessToken: process.env.ACCESS_TOKEN || "",
    options: { timeout: 5000 },
    sandbox: true,
});

const preference = new Preference(client);

function pay(id: number, price: number, userName: string, userEmail: string, userId: number): string {
    const body = {
    items: [
        {
        id: id,
        title: 'produto',
        quantity: 1,
        currency_id: 'BRL',
        unit_price: price,
        },
    ],
    payer: {
        name: userName,
        email: userEmail,
        identification: {number: userId,} // altera
    },
    payment_methods: {
        installments: 1,
        default_installments: 1
    },
    back_urls: {
        success: 'https://www.npmjs.com/package/mercadopago',
        failure: 'https://www.youtube.com/watch?v=LhpdtuPf1D0&list=RDLhpdtuPf1D0&index=30',
        pending: 'https://www.youtube.com/watch?v=LhpdtuPf1D0&list=RDLhpdtuPf1D0&index=30',
    },
    expires: false,
    auto_return: 'all',
    binary_mode: true,
    notification_url: 'http://localhost:3000/backend/teste',
    operation_type: 'regular_payment',
    statement_descriptor: 'Test Store',
    };

    return preference.create({ body }).then((data: any) => {
        return data.sandbox_init_point
    }).catch((err: any) => {
        return err
    })
}

export default pay;