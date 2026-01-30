import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { eventConfig } from "@/lib/config";
import { getAgentByCode, createOrder, getOrderByReferenceCode, createLinkVisit } from "@/lib/db";
import { registrationSchema } from "@/lib/validation";
import { formatSyp } from "@/lib/format";
import { generateOrderToken, generateReferenceCode } from "@/lib/tokens";
import Image from "next/image";
// استيراد مكون نموذج التسجيل الجديد
import RegistrationForm from "@/components/RegistrationForm";

// --- بيانات وهمية ---
const mockEventDetails = {
  description: "انضم إلينا في تجربة فريدة تجمع بين التكنولوجيا والإبداع. هذا الحدث هو فرصتك للتواصل مع قادة الصناعة، تعلم مهارات جديدة، واستكشاف أحدث الابتكارات.",
  sections: [
    {
      type: "image_gallery",
      title: "لحظات من فعالياتنا السابقة",
      images: [
        { src: "/event-gallery-1.jpg", alt: "صورة 1" },
        { src: "/event-gallery-2.jpg", alt: "صورة 2" },
        { src: "/event-gallery-3.jpg", alt: "صورة 3" },
      ],
    },
    {
      type: "text_block",
      title: "ماذا ستتعلم؟",
      content: "سنغطي أحدث الاتجاهات في الذكاء الاصطناعي، تطوير الويب الحديث، وأمن المعلومات. جهز نفسك لورش عمل عملية وجلسات نقاش ملهمة.",
    },
  ],
  speakers: [
    { name: "أحمد السيد", title: "مؤسس X-Tech", bio: "رائد في الذكاء الاصطناعي التوليدي.", image: "/speaker-ahmed.jpg" },
    { name: "ليلى محمود", title: "Innovate Co.", bio: "خبيرة تجربة المستخدم (UX).", image: "/speaker-layla.jpg" },
    { name: "سامر العلي", title: "DevOps Lead", bio: "مهندس بنية تحتية سحابية.", image: "/speaker-samer.jpg" },
  ],
  schedule: [
    { time: "09:00", title: "تسجيل الدخول", description: "استلام البطاقات والترحيب", icon: "👋" },
    { time: "10:30", title: "مستقبل AI", description: "جلسة رئيسية مع أحمد السيد", icon: "🤖" },
    { time: "01:30", title: "ورشة React", description: "تطبيق عملي مباشر", icon: "💻" },
    { time: "04:30", title: "الختام", description: "توزيع الجوائز والشبكات", icon: "🏆" },
  ],
  faq: [
    { question: "هل يشمل السعر الغداء؟", answer: "نعم، بوفيه مفتوح فاخر." },
    { question: "المواقف متوفرة؟", answer: "نعم، مجاناً للحضور." },
    { question: "سياسة الإلغاء؟", answer: "التذاكر غير مستردة ولكن قابلة للتحويل." },
  ],
};

const createUniqueReferenceCode = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const referenceCode = generateReferenceCode();
    const existing = await getOrderByReferenceCode(referenceCode);
    if (!existing) return referenceCode;
  }
  throw new Error("Unable to create unique reference code.");
};

export default async function Home({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const params = await searchParams;
  const ref = params.ref?.trim() ?? "";
  const agent = ref ? await getAgentByCode(ref) : null;

  // استخراج الصور بشكل آمن
  const gallerySection = mockEventDetails.sections.find(s => s.type === "image_gallery") as any;
  const galleryImages = gallerySection?.images || [];

  if (!ref || !agent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 p-8 text-center shadow-lg">
           <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
           </div>
           <h1 className="text-xl font-bold text-gray-900 mb-2">رابط غير صالح</h1>
           <p className="text-gray-500 text-sm">يرجى استخدام الرابط الرسمي المقدم من الوكيل.</p>
        </div>
      </main>
    );
  }

  // --- Tracking Logic ---
  try {
    const cookieStore = await cookies();
    const cookieName = `visited_agent_${agent.code}`;
    if (!cookieStore.has(cookieName)) {
      const headersList = await headers();
      await createLinkVisit({
        agent_code: ref,
        agent_id: agent.id,
        ip_address: headersList.get("x-forwarded-for")?.split(',')[0] || headersList.get("x-real-ip"),
        user_agent: headersList.get("user-agent"),
      });
      cookieStore.set(cookieName, "true", { maxAge: 86400, httpOnly: true });
    }
  } catch (error) { console.error("Tracking Error", error); }

  // --- Server Action ---
  const createOrderAction = async (formData: FormData) => {
    "use server";
    
    const parsed = registrationSchema.safeParse({
      fullName: formData.get("fullName"),
      dob: formData.get("dob"),
      pob: formData.get("pob"),
      specialization: formData.get("specialization"),
      dreamJob: formData.get("dreamJob"),
      company: formData.get("company"),
      dream: formData.get("dream"),
      skills: formData.get("skills"),
      visitCountry: formData.get("visitCountry"),
    });

    if (!parsed.success) return;

    const rawRef = String(formData.get("ref") ?? "").trim();
    const selectedAgent = rawRef ? await getAgentByCode(rawRef) : null;
    const orderToken = generateOrderToken();
    const referenceCode = await createUniqueReferenceCode();

    const { data: reg } = parsed;
    const attendeeInfo = {
      full_name: reg.fullName,
      birth_date: reg.dob,
      birth_place: reg.pob,
      specialization: reg.specialization,
      future_dream: reg.dream,
      dream_job: reg.dreamJob,
      skills: reg.skills,
      wish_visit_country: reg.visitCountry,
      company_affinity: reg.company,
    };

    await createOrder({
      order_token: orderToken,
      amount: eventConfig.ticketPriceSyp,
      reference_code: referenceCode,
      agent_id: selectedAgent?.id ?? null,
      ...attendeeInfo // تمرير المعلومات الإضافية للدالة
    });

    redirect(`/pay/${orderToken}`);
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 opacity-20 blur-[100px]"></div>
        <div className="absolute right-0 bottom-0 -z-10 h-[310px] w-[310px] rounded-full bg-purple-400 opacity-20 blur-[100px]"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 shadow-sm text-slate-600 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          {eventConfig.date} • {eventConfig.location}
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
          {eventConfig.name} <br/>
          <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-violet-600">
            حيث يبدأ المستقبل
          </span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {mockEventDetails.description}
        </p>

        {/* تم استبدال الفورم القديم بـ RegistrationForm */}
        <div className="mt-10 w-full max-w-xs mx-auto">
             <RegistrationForm 
                agentCode={agent?.code ?? ""} 
                createOrderAction={createOrderAction} 
             />
             <p className="text-sm text-slate-500 mt-3">حجز فوري وآمن • عدد المقاعد محدود</p>
        </div>
      </section>

      {/* Bento Grid Gallery Section */}
      <section className="relative z-10 max-w-6xl mx-auto py-16 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
           {/* Card 1 */}
           <div className="md:col-span-2 row-span-1 md:row-span-2 relative group overflow-hidden rounded-3xl bg-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <Image 
                 src={galleryImages[0]?.src || "/placeholder.jpg"} 
                 alt="Event Main" 
                 fill 
                 className="object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-linear-to-t from-black/60 to-transparent">
                  <h3 className="text-white text-2xl font-bold">تفاعل واتصال</h3>
              </div>
           </div>
           
           {/* Card 2 */}
           <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">ماذا ستتعلم؟</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                  {mockEventDetails.sections.find(s => s.type === "text_block")?.content}
              </p>
           </div>
           {/* Card 3 */}
           <div className="relative group overflow-hidden rounded-3xl bg-gray-100 shadow-sm hover:shadow-md transition-all">
              <Image 
                 src={galleryImages[1]?.src || "/placeholder.jpg"} 
                 alt="Side Event" 
                 fill 
                 className="object-cover transition-transform duration-700 group-hover:scale-105" 
              />
           </div>
        </div>
      </section>

      {/* Speakers Section */}
      <section className="relative z-10 py-20 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">المتحدثون</h2>
                <p className="text-slate-500">نخبة من الخبراء يشاركونك تجاربهم</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {mockEventDetails.speakers.map((speaker, idx) => (
                    <div key={idx} className="group bg-gray-50 rounded-2xl p-6 transition-all duration-300 hover:bg-white hover:shadow-xl hover:-translate-y-1 border border-transparent hover:border-gray-100">
                        <div className="flex items-center gap-4">
                            <Image 
                                src={speaker.image} 
                                alt={speaker.name} 
                                width={80} 
                                height={80} 
                                className="rounded-full object-cover w-20 h-20 border-2 border-white shadow-md" 
                            />
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{speaker.name}</h3>
                                <p className="text-blue-600 text-sm font-medium">{speaker.title}</p>
                            </div>
                        </div>
                        <p className="mt-4 text-slate-600 text-sm leading-relaxed border-t border-gray-200 pt-4">
                            {speaker.bio}
                        </p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Schedule */}
      <section className="relative z-10 max-w-4xl mx-auto py-20 px-6">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">جدول الأعمال</h2>
        <div className="space-y-6">
            {mockEventDetails.schedule.map((item, index) => (
                <div key={index} className="flex group">
                    <div className="flex flex-col items-center mr-6 min-w-[80px]">
                        <span className="text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full whitespace-nowrap group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {item.time}
                        </span>
                        {index !== mockEventDetails.schedule.length - 1 && (
                            <div className="w-px h-full bg-gray-200 my-2 group-hover:bg-blue-200 transition-colors"></div>
                        )}
                    </div>
                    <div className="pb-8">
                        <h3 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                            {item.title}
                        </h3>
                        <p className="text-slate-600 text-sm">{item.description}</p>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-[2.5rem] p-12 text-center text-white shadow-2xl overflow-hidden relative">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-30 pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500 rounded-full blur-[80px] opacity-30 pointer-events-none" />
             <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">جاهز للانطلاق؟</h2>
                <div className="flex items-center justify-center gap-2 mb-8">
                    <span className="text-5xl font-extrabold tracking-tight">
                        {formatSyp(eventConfig.ticketPriceSyp)}
                    </span>
                    <span className="text-xl text-slate-400 mt-2">ل.س</span>
                </div>
                
                {/* تم استبدال الفورم القديم بـ RegistrationForm */}
                <div className="max-w-xs mx-auto">
                    <div className="bg-white rounded-xl p-1">
                       <RegistrationForm 
                          agentCode={agent?.code ?? ""} 
                          createOrderAction={createOrderAction} 
                       />
                    </div>
                </div>
             </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 max-w-3xl mx-auto py-16 px-6">
         <h2 className="text-2xl font-bold text-center text-slate-900 mb-10">أسئلة متكررة</h2>
         <div className="space-y-4">
            {mockEventDetails.faq.map((item, idx) => (
                <details key={idx} className="group bg-white border border-gray-200 rounded-2xl open:ring-2 open:ring-blue-100 transition-all">
                    <summary className="flex justify-between items-center p-6 font-semibold cursor-pointer list-none text-slate-800">
                        <span>{item.question}</span>
                        <span className="transition-transform group-open:rotate-180 text-gray-400">
                            <svg fill="none" height="24" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                        </span>
                    </summary>
                    <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed animate-in fade-in slide-in-from-top-1">
                        {item.answer}
                    </div>
                </details>
            ))}
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 text-center">
        <p className="text-slate-500 text-sm">© {new Date().getFullYear()} {eventConfig.name}. جميع الحقوق محفوظة.</p>
      </footer>
    </main>
  );
}
