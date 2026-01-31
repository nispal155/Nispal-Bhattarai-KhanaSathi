import Footer from "@/components/layout/Footer";

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1">
                {children}
            </main>
            <Footer />
        </div>
    );
}
