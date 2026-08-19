import type { Metadata } from "next";
import FinanceApp from "@/components/finance-app";

export const metadata: Metadata = { title: "Live Demo" };
export default function DemoPage() { return <FinanceApp mode="demo" />; }
