import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import Header from "../componentsForHome/Header";
import NavTabs from "../componentsForHome/NavTabs";
import ActionButtons from "../componentsForHome/ActionButtons";
import ListingsHeading from "../componentsForHome/ListingsHeading";
import EntriesAndSearchBar from "../componentsForHome/EntriesAndSearchBar";
import ListingsTable from "../componentsForHome/ListingsTable";
import PaginationBar from "../componentsForHome/PaginationBar";
import Footer from "../componentsForHome/Footer";
import ScrollToTopButton from "../componentsForHome/ScrollToTopButton";
import { userStore } from "../store/authStore";

export default function Home({ handleLogout }) {
  const [page, setPage] = useState(1);
  const location = useLocation();
  const user = userStore(store => store.user)
  const navigate = useNavigate();
  console.log(`user logged in ${user.email}`)
  // useEffect(() => {
  //   if (!user) {
  //     navigate("/login")
  //   }
  // },[user])

  const isDashboard = location.pathname === "/home";

  return (
    <>
      {/* Always show layout: header, nav, footer, help */}
      <Header handleLogout={handleLogout} />
      <NavTabs />

      {/* Nested route rendering */}
      <Outlet />

      {/* Dashboard content only for /home route */}
      {isDashboard && (
        <>
          <ActionButtons />
          <ListingsHeading />
          <EntriesAndSearchBar />
          <ListingsTable />
          <PaginationBar currentPage={page} totalPages={4} onPageChange={setPage} />
        </>
      )}

      <Footer />
      <ScrollToTopButton />
    </>
  );
}
