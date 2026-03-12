import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "~/components/shared/Layout";
import { PageTransition } from "~/components/shared/PageTransition";
import { contentService } from "~/lib/content.service";
import { imageurl } from "~/lib/sanity.server";
import { useState } from "react";
import { buildBandMeta } from "~/utils/seo";
import { BandStructuredData } from "~/components/StructuredData";
import { useReducedMotion } from "~/hooks/useReducedMotion";
import { staggerContainerVariants, itemVariants, buttonVariants } from "~/lib/animationVariants";

interface LoaderData {
  band: any;
  musicians: any[];
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { subdomain } = params;
  const band = await contentService.getBandBySlug(subdomain);
  
  if (!band) {
    throw new Response("Band not found", { status: 404 });
  }
  
  const musicians = await contentService.getMusiciansByBandId(band._id);
  
  return { band, musicians, request };
}

export function meta({ loaderData }: { loaderData: Awaited<ReturnType<typeof loader>> | null }) {
  if (!loaderData?.band) return [];
  return buildBandMeta(loaderData.band, loaderData.request, "musicians");
}

export default function MusiciansPage() {
  const { band, musicians, request } = useLoaderData() as any;
  const [expandedMusician, setExpandedMusician] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();

  return (
    <>
      <BandStructuredData band={band} request={request} />
      <Layout band={band}>
        <PageTransition>
          <div className="py-16 px-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <motion.h1
                className="text-4xl font-bold text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Our Musicians
              </motion.h1>

              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {musicians.map((musician) => (
                  <motion.div
                    key={musician._id}
                    variants={itemVariants}
                    className="bg-white rounded-lg shadow-lg overflow-hidden"
                    whileHover={{ y: -8, boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.2)" }}
                    transition={{ duration: 0.3 }}
                  >
{musician.photo && (
                       <motion.img
                         src={imageurl(musician.photo).width(400).height(400).fit("crop").url()}
                         alt={musician.name}
                         loading="lazy"
                         decoding="async"
                         className="w-full h-64 object-cover"
                         whileHover={{ scale: 1.05 }}
                         transition={{ duration: 0.4 }}
                       />
                     )}

                    <div className="p-6">
                      <h2 className="text-2xl font-bold mb-2">{musician.name}</h2>
                      {musician.instrument && (
                        <p className="text-blue-600 font-semibold mb-4">{musician.instrument}</p>
                      )}

                      <motion.button
                        onClick={() => setExpandedMusician(expandedMusician === musician._id ? null : musician._id)}
                        className="text-blue-600 hover:underline"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {expandedMusician === musician._id ? "Show Less" : "Read Bio"}
                      </motion.button>

                      <AnimatePresence>
                        {expandedMusician === musician._id && musician.bio && (
                          <motion.div
                            className="mt-4 prose max-w-none"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            {musician.bio.map((block, idx) => (
                              <p key={idx}>{block.children?.[0]?.text}</p>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {musician.gallery && musician.gallery.length > 0 && (
                        <motion.div
                          className="mt-4 grid grid-cols-3 gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
{musician.gallery.slice(0, 3).map((img, idx) => (
                             <motion.img
                               key={idx}
                               src={imageurl(img).width(150).height(150).fit("crop").url()}
                               alt={img.caption || `${musician.name} photo ${idx + 1}`}
                               loading="lazy"
                               decoding="async"
                               className="w-full h-20 object-cover rounded"
                               whileHover={{ scale: 1.1, rotate: 2 }}
                               transition={{ duration: 0.2 }}
                             />
                           ))}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </PageTransition>
      </Layout>
    </>
  );
}
