import { NextApiRequest, NextApiResponse } from "next";

import { Readable } from "stream";
import Stripe from "stripe";
import { stripe } from "../../services/stripe";

async function buffer(readable: Readable) {
	const chunks = [];

	for await (const chunk of readable) {
		chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
	}

	return Buffer.concat(chunks);
}

//Next - mudando o bodyparser da conexao.
export const config = {
	api: {
		bodyParser: false,
	},
};

const relevantEvents = new Set([
	"checkout.session.completed",
	"customer.subscription.deleted",
	"customer.subscription.updated",
]);

export default async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method === "POST") {
		const buf = await buffer(req);
		const secret = req.headers["stripe-signature"];
		console.log(secret);
		console.log(".env", process.env.STRIPE_WEBHOOK_SECRET);

		let event: Stripe.Event;

		try {
			event = stripe.webhooks.constructEvent(
				buf,
				secret,
				process.env.STRIPE_WEBHOOK_SECRET
			);
			console.log(event);
		} catch (error) {
			return res.status(400).send(`Webhook error: ${error.message}`);
		}

		const { type } = event;
		if (relevantEvents.has(type)) {
			// fazer algo
			console.log("evento recebido", event);
		}

		res.status(200).json({ received: true });
	} else {
		res.setHeader("Allow", "POST");
		res.status(405).end("Method not allowed");
	}
};
