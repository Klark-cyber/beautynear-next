import { useMemo } from 'react';
import { ApolloClient, ApolloLink, InMemoryCache, from, NormalizedCacheObject } from '@apollo/client';
import createUploadLink from 'apollo-upload-client/public/createUploadLink.js';
import { onError } from '@apollo/client/link/error';
import { getJwtToken } from '../libs/auth';
import { TokenRefreshLink } from 'apollo-link-token-refresh';
let apolloClient: ApolloClient<NormalizedCacheObject>;

function getHeaders() {
	const headers = {} as HeadersInit;
	const token = getJwtToken();
	// @ts-ignore
	if (token) headers['Authorization'] = `Bearer ${token}`;
	return headers;
}

const tokenRefreshLink = new TokenRefreshLink({
	accessTokenField: 'accessToken',
	isTokenValidOrUndefined: () => {
		return true;
	}, // @ts-ignore
	fetchAccessToken: () => {
		// execute refresh token
		return null;
	},
});

// ⚠️ TUZATILDI: avval bu yerda `WebSocketLink` va `split` orqali,
// hech qanday subscription so'rovi ishlatilmasa ham, HAR DOIM
// WebSocket ulanishi ochilardi. Agar bu ulanish muvaffaqiyatsiz
// bo'lsa yoki osilib qolsa, BUTUN Apollo Client ishga tushmay
// qolishi (yoki juda kech tushishi) mumkin edi — bu, ehtimol,
// nega hech qanday GraphQL so'rovi (salon, xizmat) hatto
// Network panelida ko'rinmasligining sababi edi. Chat funksiyasi
// o'zining alohida, oddiy WebSocket ulanishidan foydalanadi — bu
// Apollo linkiga umuman bog'liq emas edi.
function createIsomorphicLink() {
	if (typeof window !== 'undefined') {
		const authLink = new ApolloLink((operation, forward) => {
			operation.setContext(({ headers = {} }) => ({
				headers: {
					...headers,
					...getHeaders(),
				},
			}));
			return forward(operation);
		});

		// @ts-ignore
		const link = new createUploadLink({
			uri: process.env.REACT_APP_API_GRAPHQL_URL,
		});

		const errorLink = onError(({ graphQLErrors, networkError }) => {
			if (graphQLErrors) {
				graphQLErrors.map(({ message, locations, path }) =>
					console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`),
				);
			}
			if (networkError) console.log(`[Network error]: ${networkError}`);
			// @ts-ignore
			if (networkError?.statusCode === 401) {
			}
		});

		return from([errorLink, tokenRefreshLink, authLink.concat(link)]);
	}
}

function createApolloClient() {
	return new ApolloClient({
		ssrMode: typeof window === 'undefined',
		link: createIsomorphicLink(),
		// ⚠️ YANGI — avval hech qanday typePolicies yo'q edi. Turli
		// so'rovlar BIR XIL Member/Salon/Service obyektini TURLI
		// maydonlar to'plami bilan qaytarganda (masalan bir joyda
		// meFollowed bor, boshqasida yo'q), Apollo standart birlashtirish
		// qoidasi "Cannot convert object to primitive value" xatosiga
		// olib kelardi. `merge: true` — maydonlarni majburiy bir xil
		// deb talab qilmasdan, xavfsiz birlashtiradi.
		cache: new InMemoryCache({
			typePolicies: {
				Member: { merge: true },
				Salon: { merge: true },
				Service: { merge: true },
				BoardArticle: { merge: true },
				Notification: { merge: true },
			},
		}),
		resolvers: {},
	});
}

export function initializeApollo(initialState = null) {
	const _apolloClient = apolloClient ?? createApolloClient();
	if (initialState) _apolloClient.cache.restore(initialState);
	if (typeof window === 'undefined') return _apolloClient;
	if (!apolloClient) apolloClient = _apolloClient;

	return _apolloClient;
}

export function useApollo(initialState: any) {
	return useMemo(() => initializeApollo(initialState), [initialState]);
}

/**
import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

// No Subscription required for develop process

const httpLink = createHttpLink({
  uri: "http://localhost:3007/graphql",
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export default client;
*/