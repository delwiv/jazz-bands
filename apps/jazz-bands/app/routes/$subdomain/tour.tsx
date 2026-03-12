import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { motion } from "framer-motion";
import { Layout } from "~/components/shared/Layout";
import { PageTransition } from "~/components/shared/PageTransition";
import { contentService } from "~/lib/content.service";
import { useState } from "react";
import { buildBandMeta } from "~/utils/seo";
import { BandStructuredData, EventStructuredData } from "~/components/StructuredData";
import { useReducedMotion } from "~/hooks/useReducedMotion";
import { staggerContainerVariants, itemVariants } from "~/lib/animationVariants";

interface LoaderData {
  band: any;
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { subdomain } = params;
  const band = await contentService.getBandBySlug(subdomain);
  
  if (!band) {
    throw new Response("Band not found", { status: 404 });
  }
  
  return { band, request };
}

export function meta({ loaderData }: { loaderData: Awaited<ReturnType<typeof loader>> | null }) {
  if (!loaderData?.band) return [];
  return buildBandMeta(loaderData.band, loaderData.request, "tour");
}

export default function TourPage() {
  const { band, request } = useLoaderData() as any;
  const [filterRegion, setFilterRegion] = useState<string>("");
  const reducedMotion = useReducedMotion();
  
  const regions = Array.from(new Set(band.tourDates?.map((d: any) => d.region).filter(Boolean)));
  
  const filteredDates = filterRegion
    ? band.tourDates?.filter((d: any) => d.region === filterRegion) || []
    : band.tourDates || [];
  
  const upcomingDates = filteredDates
    .filter((d: any) => new Date(d.date) > new Date())
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return (
    <>
      <BandStructuredData band={band} request={request} />
      {upcomingDates.map((date: any, idx: number) => (
        <EventStructuredData key={idx} event={date} band={band} request={request} />
      ))}
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
                Tour Dates
              </motion.h1>
          
          {regions.length > 0 && (
            <div className="mb-8 text-center">
              <label className="mr-4 font-semibold">Filter by Region:</label>
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="">All Regions</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {upcomingDates.length === 0 ? (
            <p className="text-center text-gray-600">No upcoming shows scheduled.</p>
          ) : (
            <motion.div
              className="space-y-4"
              variants={staggerContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {upcomingDates.map((date: any, idx: number) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  whileHover={{ y: -4, boxShadow: "0 12px 24px -8px rgba(0, 0, 0, 0.15)" }}
                  transition={{ duration: 0.3 }}
                >
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {new Date(date.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xl font-semibold mt-2">{date.venue}</p>
                    <p className="text-gray-600">
                      {date.city}, {date.region || ""}
                    </p>
                    {date.details && (
                      <p className="mt-2 text-gray-700">{date.details}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-4">
                    {date.soldOut ? (
                      <span className="bg-red-700 text-white px-6 py-2 rounded-lg font-semibold">
                        Sold Out
                      </span>
                    ) : date.ticketsUrl ? (
                      <motion.a
                        href={date.ticketsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Get Tickets
                      </motion.a>
                    ) : (
                      <span className="bg-gray-400 text-white px-6 py-2 rounded-lg">
                        Tickets TBA
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
        </PageTransition>
      </Layout>
    </>
  );
}
