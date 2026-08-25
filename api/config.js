module.exports = async function handler(request) {
    if (request.method !== "GET") {
        return new Response(
            JSON.stringify({
                success: false,
                message: "Method not allowed",
            }),
            {
                status: 405,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    }

    return new Response(
        JSON.stringify({
            success: true,
            publicKey: process.env.PUBLIC_KEY,
            serviceId: process.env.SERVICE_ID,
            templateId: process.env.TEMPLATE_ID,
        }),
        {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
            },
        }
    );
};