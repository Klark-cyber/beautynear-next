import { sweetMixinErrorAlert } from './sweetAlert';
import numeral from 'numeral';

export const formatterStr = (value: number | undefined): string => {
	return numeral(value).format('0,0') != '0' ? numeral(value).format('0,0') : '';
};

// ── SALON ─────────────────────────────────────────────────────────────────────

export const likeTargetSalonHandler = async (likeTargetSalon: any, id: string) => {
	try {
		await likeTargetSalon({
			variables: {
				input: id,
			},
		});
	} catch (err: any) {
		console.log('ERROR, likeTargetSalonHandler:', err.message);
		sweetMixinErrorAlert(err.message).then();
	}
};

// ── SERVICE ───────────────────────────────────────────────────────────────────

export const likeTargetServiceHandler = async (likeTargetService: any, id: string) => {
	try {
		await likeTargetService({
			variables: {
				input: id,
			},
		});
	} catch (err: any) {
		console.log('ERROR, likeTargetServiceHandler:', err.message);
		sweetMixinErrorAlert(err.message).then();
	}
};

// ── BOARD ARTICLE ─────────────────────────────────────────────────────────────

export const likeTargetBoardArticleHandler = async (likeTargetBoardArticle: any, id: string) => {
	try {
		await likeTargetBoardArticle({
			variables: {
				input: id,
			},
		});
	} catch (err: any) {
		console.log('ERROR, likeTargetBoardArticleHandler:', err.message);
		sweetMixinErrorAlert(err.message).then();
	}
};

// ── MEMBER ────────────────────────────────────────────────────────────────────

export const likeTargetMemberHandler = async (likeTargetMember: any, id: string) => {
	try {
		await likeTargetMember({
			variables: {
				input: id,
			},
		});
	} catch (err: any) {
		console.log('ERROR, likeTargetMemberHandler:', err.message);
		sweetMixinErrorAlert(err.message).then();
	}
};

// ── SALON OPEN/CLOSE ──────────────────────────────────────────────────────────

export const isSalonOpen = (workHours: string): boolean => {
	try {
		const [open, close] = workHours.split('-'); // "09:00-21:00"
		const now = new Date();
		const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
		return currentTime >= open && currentTime <= close;
	} catch {
		return false;
	}
};
// ── SAVED ITEMS (localStorage) ──────────────────────────────────────────────
// Like'dan farqli — bu shaxsiy, faqat shu qurilmada saqlanadigan
// "keyinroq ko'rish uchun" ro'yxati.

const SAVED_SALONS_KEY = 'saved_salons';
const SAVED_SERVICES_KEY = 'saved_services';

const readSavedList = (key: string): string[] => {
	if (typeof window === 'undefined') return [];
	try {
		const raw = localStorage.getItem(key);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
};

const writeSavedList = (key: string, list: string[]): void => {
	if (typeof window === 'undefined') return;
	localStorage.setItem(key, JSON.stringify(list));
};

export const getSavedSalonIds = (): string[] => readSavedList(SAVED_SALONS_KEY);

export const isSalonSaved = (id: string): boolean => getSavedSalonIds().includes(id);

export const toggleSavedSalon = (id: string): boolean => {
	const list = getSavedSalonIds();
	const exists = list.includes(id);
	const next = exists ? list.filter((x) => x !== id) : [...list, id];
	writeSavedList(SAVED_SALONS_KEY, next);
	return !exists;
};

export const getSavedServiceIds = (): string[] => readSavedList(SAVED_SERVICES_KEY);

export const isServiceSaved = (id: string): boolean => getSavedServiceIds().includes(id);

export const toggleSavedService = (id: string): boolean => {
	const list = getSavedServiceIds();
	const exists = list.includes(id);
	const next = exists ? list.filter((x) => x !== id) : [...list, id];
	writeSavedList(SAVED_SERVICES_KEY, next);
	return !exists;
};