
import { Startup } from "@/types/startup";
import { SortOption } from "@/hooks/use-discover-companies";

/**
 * Enriches raw company data with additional fields and formats
 */
export const enrichCompanyData = (companies: any[]): Startup[] => {
  return companies.map(company => {
    const websiteField = company.website && typeof company.website === 'string' ? company.website.trim() : '';
    
    return {
      ...company,
      score: Math.floor(Math.random() * 40) + 60,
      lookingForFunding: company.looking_for_funding || false,
      lookingForDesignPartner: company.looking_for_design_partner || false,
      website: websiteField,
      websiteUrl: websiteField,
      demoUrl: company.demo_url || '#',
      demoVideo: company.demo_video || undefined,
      demoVideoPath: company.demo_video_path || undefined,
      raisedAmount: company.raised_amount || undefined,
      foundedYear: company.founded || undefined,
      teamSize: company.employees ? parseInt(company.employees, 10) : undefined,
      createdAt: company.created_at || undefined
    };
  });
};

/**
 * Sorts companies based on the selected sort option
 */
export const sortCompanies = (companies: Startup[], sortOption: SortOption): Startup[] => {
  let sortedCompanies = [...companies];
  
  if (sortOption === 'match') {
    sortedCompanies.sort((a, b) => (b.score || 0) - (a.score || 0));
  } else if (sortOption === 'recent') {
    sortedCompanies.sort((a, b) => {
      // Add null checks to handle potential undefined createdAt values
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } else if (sortOption === 'raised') {
    sortedCompanies.sort((a, b) => {
      const amountA = parseFloat(a.raisedAmount?.replace(/[^0-9.-]+/g, '') || '0');
      const amountB = parseFloat(b.raisedAmount?.replace(/[^0-9.-]+/g, '') || '0');
      return amountB - amountA;
    });
  }
  
  return sortedCompanies;
};

/**
 * Filters companies by match score
 */
export const filterByMatchScore = (companies: Startup[], minMatch?: number): Startup[] => {
  if (!minMatch) return companies;
  
  return companies.filter(company => (company.score || 0) >= minMatch);
};
