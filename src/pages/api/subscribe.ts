import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import { query as q } from "faunadb";
import { fauna } from "../../services/fauna";
import { stripe } from "../../services/stripe";

type User = {
	ref: {
		id: string;
	};
	data: {
		stripe_customer_id: string;
	};
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method === "POST") {
		//criando usuario no Stripe

		// acessando nosso next-auth vamos recuperar a sessao do usuario logado.
		const session = await getSession({ req });

		/**
		 * Para não duplicar usuarios dentro do nosso Stripe, vamos consultar nosso banco
		 * obter o stripe_customer_id e verificar se existe valor dentro.
		 */
		//recuperando usuario dentro do banco fauna.
		const user = await fauna.query<User>(
			q.Get(
				// select
				q.Match(
					//where
					q.Index("user_by_email"), //campo
					q.Casefold(session.user.email) // ==
				)
			)
		);

		//passando o valor obtido do nosso banco de dados referente ao ID do Stripe
		let customerId = user.data.stripe_customer_id;

		//verificando se esse cliente já tem conta no Stripe
		//Caso não tenha
		if (!customerId) {
			//Criando uma conta para ele no banco do Stripe
			const stripeCustomer = await stripe.customers.create({
				email: session.user.email,
				// meta
			});

			/**
			 * Conta criada, devemos informar nosso banco de dados FaunaDB que esse cliente
			 * agora tem uma conta no Stripe
			 */

			//adicionando ID do Stripe para dentro do nosso banco faunaDB
			await fauna.query(
				q.Update(q.Ref(q.Collection("users"), user.ref.id), {
					data: {
						stripe_customer_id: stripeCustomer.id,
					},
				})
			);

			/**
			 * Com tudo ocorrendo certo, devo mudar o valor do customerId, pq agora
			 * esse cliente tem conta no Stripe.
			 */
			customerId = stripeCustomer.id;
		}

		//Mandando cliente para tela de checkout do Stripe
		const stripeCheckoutSession = await stripe.checkout.sessions.create({
			customer: customerId, // Cliente que vai realizar o pagamento
			payment_method_types: ["card"], // metodos de pagamento que irei aceitar.
			billing_address_collection: "required", // Endereço é obrigatorio.
			line_items: [
				{
					price: "price_1If3DVH1bObiaepXJbs5MVZ3",
					quantity: 1,
				},
			],
			mode: "subscription", // Cobrança recorrente.
			allow_promotion_codes: true, // permite códigos promocionais.
			success_url: "http://localhost:3000/pots", //caso ele faça o pagamento mando para
			cancel_url: "http://localhost:3000", //caso de erro mando para.
		});

		return res.status(200).json({ sessionId: stripeCheckoutSession.id });
	} else {
		res.setHeader("Allow", "POST");
		res.status(405).end("Method not allowed");
	}
};
