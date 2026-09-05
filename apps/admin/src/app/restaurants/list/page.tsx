import { redirect } from "next/navigation";
/* The product has one configured restaurant; retain this URL only as a compatibility redirect. */
export default function RestaurantsPage() { redirect("/dashboard"); }
/*
import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApiFetch } from "@/lib/admin-api";
import { DataPlaceholder } from "@/components/restaurants/restaurant-workspace";
*/
