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