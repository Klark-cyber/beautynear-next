import { NextPage } from 'next';
import { Stack } from '@mui/material';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutMain from '../libs/components/layout/LayoutHome';
import useDeviceDetect from '../libs/hooks/useDeviceDetect';
import HeroSection from '../libs/components/homepage/Herosection';
import CategoryChips from '../libs/components/homepage/Categorychips';
import NearbySalons from '../libs/components/homepage/Nearbysalons';
import HowItWorks from '../libs/components/homepage/Howitworks';
import FeaturedClinics from '../libs/components/homepage/Featuredclinics';
import TrendingServices from '../libs/components/homepage/Trendingservices';
import PopularSalons from '../libs/components/homepage/Popularsalons';
import UpcomingEvents from '../libs/components/homepage/Upcomingevents';
import CommunityHighlights from '../libs/components/homepage/Communityhighlights';
import NewsletterBanner from '../libs/components/homepage/Newsletterbanner';
import AppDownload from '../libs/components/homepage/Appdownload';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Home: NextPage = () => {
	const device = useDeviceDetect();

	if (device === 'mobile') {
		return (
			<Stack className="home-page">
				<HeroSection />
				<CategoryChips />
				<TrendingServices />
				<PopularSalons />
				<FeaturedClinics />
				<NewsletterBanner />
				<UpcomingEvents />
				<CommunityHighlights />
			</Stack>
		);
	}

	return (
		<Stack className="home-page">
			<HeroSection />
			<CategoryChips />
			<NearbySalons />
			<HowItWorks />
			<FeaturedClinics />
			<TrendingServices />
			<PopularSalons />
			<UpcomingEvents />
			<CommunityHighlights />
			<NewsletterBanner />
			<AppDownload />
		</Stack>
	);
};

export default withLayoutMain(Home);