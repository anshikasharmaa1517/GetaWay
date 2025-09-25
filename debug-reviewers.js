// Debug script to check reviewers in your database
// Run this in your browser console on your Vercel site

async function debugReviewers() {
  try {
    console.log("🔍 Checking reviewers in database...");
    
    // Fetch all reviewers
    const response = await fetch('/api/reviewers');
    const data = await response.json();
    
    console.log("📊 Total reviewers found:", data.reviewers?.length || 0);
    
    if (data.reviewers && data.reviewers.length > 0) {
      console.log("📋 Reviewer details:");
      data.reviewers.forEach((reviewer, index) => {
        console.log(`${index + 1}. ${reviewer.name || 'No name'}`);
        console.log(`   - ID: ${reviewer.id}`);
        console.log(`   - Slug: ${reviewer.slug || 'NO SLUG'}`);
        console.log(`   - Company: ${reviewer.company || 'No company'}`);
        console.log(`   - Has slug: ${!!reviewer.slug}`);
        console.log('---');
      });
      
      // Check how many have slugs
      const withSlugs = data.reviewers.filter(r => r.slug);
      const withoutSlugs = data.reviewers.filter(r => !r.slug);
      
      console.log(`✅ Reviewers with slugs: ${withSlugs.length}`);
      console.log(`❌ Reviewers without slugs: ${withoutSlugs.length}`);
      
      if (withoutSlugs.length > 0) {
        console.log("🚨 Reviewers without slugs (View Profile won't work):");
        withoutSlugs.forEach(r => {
          console.log(`   - ${r.name || 'No name'} (ID: ${r.id})`);
        });
      }
    } else {
      console.log("❌ No reviewers found in database");
    }
  } catch (error) {
    console.error("❌ Error checking reviewers:", error);
  }
}

// Run the debug function
debugReviewers();
