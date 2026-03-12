import type { Band } from "~/lib/types";

interface FooterProps {
  band: Band;
}

export function Footer({ band }: FooterProps) {
  const secondaryColor = band.branding?.secondaryColor || "#dc2626";
  
  return (
    <footer style={{ backgroundColor: secondaryColor }} className="py-8 px-6 mt-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-white font-bold text-lg mb-4">{band.name}</h3>
          <p className="text-white/80">
            {band.description?.[0]?.children?.[0]?.text || "Jazz band"}
          </p>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-4">Contact</h4>
          {band.contact?.email && (
            <p className="text-white/80">📧 {band.contact.email}</p>
          )}
          {band.contact?.phone && (
            <p className="text-white/80">📞 {band.contact.phone}</p>
          )}
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-4">Follow Us</h4>
          <div className="flex gap-4">
            {band.socialMedia?.map((social, idx) => (
              <a
                key={idx}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white"
              >
                {social.platform}
              </a>
            ))}
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-white/20 text-center text-white/60">
        <p>© {new Date().getFullYear()} {band.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}
