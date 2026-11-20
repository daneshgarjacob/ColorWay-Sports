import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GroupPage, { groupMetadata, groupStaticParams } from "@/components/browse/GroupPage";
import { findGroup } from "@/lib/teamGroups";

// Division / conference page (11/19). See components/browse/GroupPage.tsx.
export const revalidate = 3600;
export const dynamicParams = false;
export const generateStaticParams = () => groupStaticParams("nba");

export async function generateMetadata({ params }: { params: Promise<{ group: string }> }): Promise<Metadata> {
  return groupMetadata("nba", (await params).group);
}

export default async function Page({ params }: { params: Promise<{ group: string }> }) {
  const { group } = await params;
  if (!findGroup("nba", group)) notFound();
  return <GroupPage league="nba" slug={group} />;
}
