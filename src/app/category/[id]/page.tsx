import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackgroundBlobs from "@/components/BackgroundBlobs";
import { notFound } from "next/navigation";

interface CategoryPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const { data: categories } = await supabase.from('categories').select('id');
  return categories?.map((cat) => ({ id: cat.id })) || [];
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { id } = await params;
  const { data: category } = await supabase.from('categories').select('*').eq('id', id).single();
  return {
    title: category ? `${category.name} – MiAi` : "Category – MiAi",
    description: category?.description ?? "Explore AI tools on MiAi.",
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id } = await params;
  const { data: category } = await supabase.from('categories').select('*').eq('id', id).single();
  const { data: tools } = await supabase.from('tools').select('*').eq('category', id);

  if (!category) {
    notFound();
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundBlobs />
      <Navbar />

      <section className="relative z-10 px-6 md:px-12 lg:px-20 pt-10 pb-20">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Category Header */}
        <div className="mb-12">
          <span className="text-5xl mb-4 block">{category.icon}</span>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
            {category.name}
          </h1>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl">
            {category.description}
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools && tools.map((tool) => (
            <Link
              key={tool.id}
              href={`/tool/${tool.id}`}
              id={`tool-${tool.id}`}
              className="tool-card rounded-2xl p-6 flex flex-col justify-between min-h-[220px]"
            >
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {tool.name}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-3">
                  {tool.description}
                </p>
              </div>
              <span className="btn-try-now mt-6 flex items-center justify-center gap-2 w-full py-2.5 rounded-full text-sm font-medium text-gray-300">
                Try Now <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
