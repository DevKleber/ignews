import { SignInButton } from "../SignInButton";
import styles from "./styles.module.scss";

export function Header() {
	return (
		<header className={styles.headercontainer}>
			<div className={styles.headerContent}>
				<img src="/images/logo.svg" alt="Logo" />
				<nav>
					<a className={styles.active}>Home</a>
					<a>Posts</a>
				</nav>
				<SignInButton />
			</div>
		</header>
	);
}
