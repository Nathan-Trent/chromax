// All text content comes from CMS (content_pages table). To edit: Admin → Content → Homepage.
// Design and layout are fixed in code.

import { AboutSection } from "@/components/public/home/AboutSection";
import { CategoriesSection } from "@/components/public/home/CategoriesSection";
import { CertificationsSection } from "@/components/public/home/CertificationsSection";
import { ColourLabCTASection } from "@/components/public/home/ColourLabCTASection";
import { CTASection } from "@/components/public/home/CTASection";
import { FeaturedProductsSection } from "@/components/public/home/FeaturedProductsSection";
import { HeroSection } from "@/components/public/home/HeroSection";
import { ProjectsSection } from "@/components/public/home/ProjectsSection";
import { TestimonialsSection } from "@/components/public/home/TestimonialsSection";
import { TrustBar } from "@/components/public/home/TrustBar";
import { getActiveCertifications } from "@/lib/supabase/queries/certifications-public";
import type { HomepageContent } from "@/lib/content/homepage";
import {
  getFeaturedProducts,
  getHomepageContent,
} from "@/lib/supabase/queries/content-public";
import { getRecentProjects } from "@/lib/supabase/queries/projects-public";
import { getSwatches } from "@/lib/supabase/queries/swatches";

export default async function HomePage() {
  const [content, featuredProducts, recentProjects, certifications, swatches] = await Promise.all([
    getHomepageContent(),
    getFeaturedProducts(4),
    getRecentProjects(3),
    getActiveCertifications(4),
    getSwatches(),
  ]);

  const swatchHexes = swatches.map((s) => s.hex);

  const trustStats = [
    { number: content.trust_stat_1_number, label: content.trust_stat_1_label },
    { number: content.trust_stat_2_number, label: content.trust_stat_2_label },
    { number: content.trust_stat_3_number, label: content.trust_stat_3_label },
    { number: content.trust_stat_4_number, label: content.trust_stat_4_label },
  ];

  const heroContent: Pick<
    HomepageContent,
    | "hero_heading"
    | "hero_subheading"
    | "hero_cta_primary"
    | "hero_cta_secondary"
    | "hero_badge"
    | "hero_trust_1"
    | "hero_trust_2"
    | "hero_trust_3"
    | "hero_trust_4"
  > = {
    hero_heading: content.hero_heading,
    hero_subheading: content.hero_subheading,
    hero_cta_primary: content.hero_cta_primary,
    hero_cta_secondary: content.hero_cta_secondary,
    hero_badge: content.hero_badge,
    hero_trust_1: content.hero_trust_1,
    hero_trust_2: content.hero_trust_2,
    hero_trust_3: content.hero_trust_3,
    hero_trust_4: content.hero_trust_4,
  };

  const productsContent: Pick<
    HomepageContent,
    "products_label" | "products_heading" | "products_subtext"
  > = {
    products_label: content.products_label,
    products_heading: content.products_heading,
    products_subtext: content.products_subtext,
  };

  const aboutContent: Pick<
    HomepageContent,
    | "about_label"
    | "about_heading"
    | "about_body_1"
    | "about_body_2"
    | "about_stat_1_number"
    | "about_stat_1_label"
    | "about_stat_2_number"
    | "about_stat_2_label"
    | "about_cta"
    | "about_feature_1"
    | "about_feature_2"
    | "about_feature_3"
    | "about_feature_4"
  > = {
    about_label: content.about_label,
    about_heading: content.about_heading,
    about_body_1: content.about_body_1,
    about_body_2: content.about_body_2,
    about_stat_1_number: content.about_stat_1_number,
    about_stat_1_label: content.about_stat_1_label,
    about_stat_2_number: content.about_stat_2_number,
    about_stat_2_label: content.about_stat_2_label,
    about_cta: content.about_cta,
    about_feature_1: content.about_feature_1,
    about_feature_2: content.about_feature_2,
    about_feature_3: content.about_feature_3,
    about_feature_4: content.about_feature_4,
  };

  const labContent: Pick<
    HomepageContent,
    "colourlab_label" | "colourlab_heading" | "colourlab_body" | "colourlab_cta"
  > = {
    colourlab_label: content.colourlab_label,
    colourlab_heading: content.colourlab_heading,
    colourlab_body: content.colourlab_body,
    colourlab_cta: content.colourlab_cta,
  };

  const projectsContent: Pick<HomepageContent, "projects_label" | "projects_heading"> = {
    projects_label: content.projects_label,
    projects_heading: content.projects_heading,
  };

  const certsContent: Pick<HomepageContent, "certs_label" | "certs_heading"> = {
    certs_label: content.certs_label,
    certs_heading: content.certs_heading,
  };

  const testimonialsContent: Pick<
    HomepageContent,
    | "testimonials_label"
    | "testimonials_heading"
    | "trust_stat_1_number"
    | "trust_stat_1_label"
    | "trust_stat_2_number"
    | "trust_stat_2_label"
    | "testimonial_1_quote"
    | "testimonial_1_author"
    | "testimonial_1_company"
    | "testimonial_1_country"
    | "testimonial_2_quote"
    | "testimonial_2_author"
    | "testimonial_2_company"
    | "testimonial_2_country"
  > = {
    testimonials_label: content.testimonials_label,
    testimonials_heading: content.testimonials_heading,
    trust_stat_1_number: content.trust_stat_1_number,
    trust_stat_1_label: content.trust_stat_1_label,
    trust_stat_2_number: content.trust_stat_2_number,
    trust_stat_2_label: content.trust_stat_2_label,
    testimonial_1_quote: content.testimonial_1_quote,
    testimonial_1_author: content.testimonial_1_author,
    testimonial_1_company: content.testimonial_1_company,
    testimonial_1_country: content.testimonial_1_country,
    testimonial_2_quote: content.testimonial_2_quote,
    testimonial_2_author: content.testimonial_2_author,
    testimonial_2_company: content.testimonial_2_company,
    testimonial_2_country: content.testimonial_2_country,
  };

  const ctaContent: Pick<
    HomepageContent,
    "cta_heading" | "cta_subtext" | "cta_primary" | "cta_secondary"
  > = {
    cta_heading: content.cta_heading,
    cta_subtext: content.cta_subtext,
    cta_primary: content.cta_primary,
    cta_secondary: content.cta_secondary,
  };

  return (
    <>
      <HeroSection content={heroContent} />
      <TrustBar stats={trustStats} />
      <CategoriesSection
        label={content.categories_label}
        heading={content.categories_heading}
        subtext={content.categories_subtext}
        cards={{
          cat_industrial_name: content.cat_industrial_name,
          cat_industrial_desc: content.cat_industrial_desc,
          cat_industrial_emoji: content.cat_industrial_emoji,
          cat_marine_name: content.cat_marine_name,
          cat_marine_desc: content.cat_marine_desc,
          cat_marine_emoji: content.cat_marine_emoji,
          cat_automotive_name: content.cat_automotive_name,
          cat_automotive_desc: content.cat_automotive_desc,
          cat_automotive_emoji: content.cat_automotive_emoji,
          cat_architectural_name: content.cat_architectural_name,
          cat_architectural_desc: content.cat_architectural_desc,
          cat_architectural_emoji: content.cat_architectural_emoji,
          cat_custom_name: content.cat_custom_name,
          cat_custom_desc: content.cat_custom_desc,
          cat_custom_emoji: content.cat_custom_emoji,
        }}
      />
      <FeaturedProductsSection content={productsContent} products={featuredProducts} />
      <AboutSection content={aboutContent} />
      <ColourLabCTASection content={labContent} swatchColours={swatchHexes} />
      <ProjectsSection content={projectsContent} projects={recentProjects} />
      <CertificationsSection content={certsContent} certifications={certifications} />
      <TestimonialsSection content={testimonialsContent} />
      <CTASection content={ctaContent} />
    </>
  );
}
