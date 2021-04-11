import { signIn, useSession } from "next-auth/client";
import { api } from "../../services/api";
import { getStripeJs } from "../../services/stripe-js";
import styles from "./styles.module.scss";

interface SubscribeButtonProps {
	priceId: string;
}

export function SubscribeButton({ priceId }: SubscribeButtonProps) {
	//obtendo usuario logado.
	const [session] = useSession();

	//função clique no botão subscribe now.
	async function handleSubscribe() {
		//caso usuario não esteja logado, faço o redirect para o login.
		if (!session) {
			signIn("github");
			return;
		}

		//criação do checkout session
		try {
			// faço uma requisição post para o serviço criado (src/pages/api/subscribe.ts)
			const response = await api.post("/subscribe");
			//obtendo o sessionId
			const { sessionId } = response.data;

			//fazendo redirection para o Stripe checkout.
			const stripe = await getStripeJs();
			stripe.redirectToCheckout({ sessionId });
		} catch (err) {
			alert(err.message);
		}
	}

	return (
		<button
			type="button"
			className={styles.subscribeButton}
			onClick={handleSubscribe}
		>
			Subscribe now
		</button>
	);
}
