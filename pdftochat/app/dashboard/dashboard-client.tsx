// 'use client';

// import { UploadDropzone } from 'react-uploader';
// import { Uploader } from 'uploader';
// import { useRouter } from 'next/navigation';
// import DocIcon from '@/components/ui/DocIcon';
// import { formatDistanceToNow } from 'date-fns';
// import { useState } from 'react';
// import { createClient } from '@supabase/supabase-js';

// // Configuration for the uploader
// const uploader = Uploader({
//   apiKey: !!process.env.NEXT_PUBLIC_BYTESCALE_API_KEY
//     ? process.env.NEXT_PUBLIC_BYTESCALE_API_KEY
//     : 'no api key found',
// });

// const supabaseUrl = 'YOUR_SUPABASE_URL';
// const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

// const supabase = createClient(supabaseUrl, supabaseAnonKey);

// export default function DashboardClient({ docsList }: { docsList: any }) {
//   const router = useRouter();

//   const [loading, setLoading] = useState(false);

//   const options = {
//     maxFileCount: 1,
//     mimeTypes: ['application/pdf'],
//     editor: { images: { crop: false } },
//     styles: {
//       colors: {
//         primary: '#000', // Primary buttons & links
//         error: '#d23f4d', // Error messages
//       },
//     },
//     onValidate: async (file: File): Promise<undefined | string> => {
//       return docsList.length > 10
//         ? `You've reached your limit for PDFs.`
//         : undefined;
//     },
//   };

//   const UploadDropZone = () => (
//     <UploadDropzone
//       uploader={uploader}
//       options={options}
//       onUpdate={(file) => {
//         if (file.length !== 0) {
//           console.log(file[0]);
//           setLoading(true);
//           // ingestPdf(
//           //   file[0].fileUrl,
//           //   //file[0].originalFile.originalFileName || file[0].filePath,
//           // );

//           // call the ingestPdf function with the file object
//           // ingestPdf(file[0].fileUrl);

//         }
//       }}
//       width="470px"
//       height="250px"
//     />
//   );

//   async function ingestPdf(fileUrl: string) {
//     const formData = new FormData();
//     formData.append('file', fileUrl);

//     try {
//         const response = await fetch('http://0.0.0.0:8001/upload', {
//             method: 'POST',
//             body: formData, // FormData will be sent as 'multipart/form-data'
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log(data); // Process your response here
//     } catch (error) {
//         console.error("Ingest PDF Failed:", error);
//     }
// }

// async function ingestPdf(fileUrl: string, fileName: string) {
//   let res = await fetch('/api/ingestPdf', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       fileUrl,
//       fileName,
//     }),
//   });

//   let data = await res.json();
//   router.push(`/document/${data.id}`);
// }

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadDropzone } from 'react-uploader';
import { createClient } from '@supabase/supabase-js';
import DocIcon from '@/components/ui/DocIcon';
import { formatDistanceToNow } from 'date-fns';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DashboardClient({ docsList }: { docsList: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleFileUpload(file: File) {
    setLoading(true);
    //const filePath = `files/${Date.now()}_${file.name}`;

    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `files/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('pdf-storage')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading file:', error.message);
    } else {
      console.log('File uploaded successfully:', data);

      // retrieve the public URL of the uploaded file
      const fileUrl = supabase.storage
        .from('pdf-storage')
        .getPublicUrl(filePath);

      await ingestFileByUrl(fileUrl.data.publicUrl);

    } 
    setLoading(false);
  }

  async function ingestFileByUrl(fileUrl: string): Promise<void> {
    try {
      let response = await fetch('http://0.0.0.0:8001/v1/ingest/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileURL: fileUrl }),
      });

      console.log('Response:', response);
  
      if (!response.ok) {
        // Handle error response
        console.error('Error during file ingestion API call:', response.statusText);
        alert('Failed to ingest file.');
        return;
      }
  
      let data = await response.json();
  
      console.log('Ingested document data:', data);
  
      alert('File ingestion successful!');
      // Assuming you have a way to navigate in your frontend app (e.g., using React Router, Next.js Router, etc.)
      // Replace `router` with your actual routing method
      // For example, in a Next.js app:
      // router.push(`/document/${data.id}`);
      // Make sure to adjust this to fit your actual frontend routing solution
    } catch (error) {
      console.error('Error during ingestion API call:', error);
      alert('An error occurred while ingesting the file.');
    }
  }



  // async function ingestPdf(fileUrl: string, fileName: string) {
  //   let res = await fetch('/api/ingestPdf', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       fileUrl,
  //       fileName,
  //     }),
  //   });

  //   if (!res.ok) {
  //     // Handle error response
  //     console.error('Error during ingestion API call');
  //     return;
  //   }

  //   let data = await res.json();

  //   console.log(data);
  //   console.log(data.id);

  //   alert('File ingestion successful!');
  //   router.push(`/document/${data.id}`);
  // }





  function UploadDropZone() {
    return (
      <div style={{ border: '2px solid #000', padding: '20px' }}>
        <input
          type="file"
          accept="application/pdf"
          onChange={async (e) => {
            if (e.target.files && e.target.files[0]) {
              await handleFileUpload(e.target.files[0]);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex flex-col gap-4 container mt-10">
      <h1 className="text-4xl leading-[1.1] tracking-tighter font-medium text-center">
        Upload Your Financial Documents
      </h1>
      {docsList.length > 0 && (
        <div className="flex flex-col gap-4 mx-10 my-5">
          <div className="flex flex-col shadow-sm border divide-y-2 sm:min-w-[500px] mx-auto">
            {docsList.map((doc: any) => (
              <div
                key={doc.id}
                className="flex justify-between p-3 hover:bg-gray-100 transition sm:flex-row flex-col sm:gap-0 gap-3"
              >
                <button
                  onClick={() => router.push(`/document/${doc.id}`)}
                  className="flex gap-4"
                >
                  <span>{doc.fileName}</span>
                </button>
                {/* <span>Uploaded {formatDistanceToNow(doc.createdAt)} ago</span> */}

                <button
                  onClick={() => router.push(`/document/${doc.id}`)}
                  className="flex gap-4"
                >
                  <DocIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {docsList.length > 0 ? (
        <h2 className="text-3xl leading-[1.1] tracking-tighter font-medium text-center">
          Or upload a new PDF
        </h2>
      ) : (
        <h2 className="text-1xl leading-[1.1] tracking-tighter font-medium text-center mt-5">
          No documents found. Upload a new document below!
        </h2>
      )}
      <div className="mx-auto min-w-[450px] flex justify-center">
        {loading ? (
          <button
            type="button"
            className="inline-flex items-center mt-4 px-4 py-2 font-semibold leading-6 text-lg shadow rounded-md text-black transition ease-in-out duration-150 cursor-not-allowed"
          >
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Ingesting your PDF...
          </button>
        ) : (
          <UploadDropZone />
        )}
      </div>
    </div>
  );
}
