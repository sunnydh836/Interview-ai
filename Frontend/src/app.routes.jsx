/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import Protected from "./features/auth/components/Protected";

const Login = lazy(() => import("./features/auth/pages/Login"));
const Register = lazy(() => import("./features/auth/pages/Register"));
const Home = lazy(() => import("./features/interview/pages/Home"));
const Interview = lazy(() => import("./features/interview/pages/Interview"));

const PageLoader = () => (
    <main className="loading-screen">
        <h1>Loading...</h1>
    </main>
);

export const router = createBrowserRouter([
    {
        path: "/login",
        element: <Suspense fallback={<PageLoader />}><Login /></Suspense>
    },
    {
        path: "/register",
        element: <Suspense fallback={<PageLoader />}><Register /></Suspense>
    },
    {
        path: "/",
        element: <Protected><Suspense fallback={<PageLoader />}><Home /></Suspense></Protected>
    },
    {
        path: "/interview/:interviewId",
        element: <Protected><Suspense fallback={<PageLoader />}><Interview /></Suspense></Protected>
    }
]);