import http from 'k6/http';
import { check } from 'k6';

export const options = {
    vus: 100,
    iterations: 10000,
};

export default function () {
    const response = http.post(
        'http://localhost:3000/api/orders/checkout',
        JSON.stringify({
            variantId: 'test-variant',
            quantity: 1,
        }),
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    check(response, {
        'valid checkout response': (r) =>
            r.status === 201 || r.status === 409,
    });
}


// ========================================================================================

