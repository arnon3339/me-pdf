import React from 'react'
import { FAQItem } from './faq'

// General tool FAQs
export const generalToolFAQs: FAQItem[] = [
  {
    id: 'privacy-1',
    question: 'Are my files really private?',
    answer:
      'Yes, absolutely! All processing happens locally in your browser using WebAssembly. Your files never leave your device, and we have no servers that could access them. You can verify this by checking our open-source code.',
    category: 'Privacy',
  },
  {
    id: 'privacy-2',
    question: 'Do you track my usage or store cookies?',
    answer:
      "No, we don't use any tracking, analytics, or cookies. Our website is completely privacy-focused with no data collection whatsoever.",
    category: 'Privacy',
  },
  {
    id: 'technical-1',
    question: 'What browsers are supported?',
    answer:
      'Our tools work on all modern browsers that support WebAssembly, including Chrome, Firefox, Safari, and Edge. For the best experience, we recommend using the latest version of your browser.',
    category: 'Technical',
  },
  {
    id: 'technical-2',
    question: 'What file size limits do you have?',
    answer:
      "Since processing happens in your browser, the only limit is your device's available memory. Most modern devices can handle PDFs up to several hundred MB without issues.",
    category: 'Technical',
  },
  {
    id: 'general-1',
    question: 'Is this service free?',
    answer:
      'Yes, all our PDF tools are completely free to use. The project is open-source and supported by the community.',
    category: 'General',
  },
  {
    id: 'general-2',
    question: 'Can I use these tools offline?',
    answer:
      "Once the page loads, the tools can work offline since all processing happens locally. However, you'll need an internet connection for the initial page load.",
    category: 'General',
  },
]

// PDF Merge specific FAQs
export const mergeFAQs: FAQItem[] = [
  {
    id: 'merge-1',
    question: 'How many PDFs can I merge at once?',
    answer:
      "There's no artificial limit on the number of PDFs you can merge. The only constraint is your device's memory capacity.",
    category: 'Merging',
  },
  {
    id: 'merge-2',
    question: 'Can I rearrange pages after adding them?',
    answer:
      'Yes! You can drag and drop pages in the merge area to reorder them exactly how you want before creating the final merged PDF.',
    category: 'Merging',
  },
  {
    id: 'merge-3',
    question: 'Can I merge password-protected PDFs?',
    answer:
      "Currently, password-protected PDFs are not supported. You'll need to remove the password protection before merging.",
    category: 'Merging',
  },
  {
    id: 'merge-4',
    question: 'What happens to bookmarks and metadata when merging?',
    answer: (
      <div>
        <p>When merging PDFs:</p>
        <ul className="mt-2 list-disc pl-5">
          <li>Page content is preserved exactly</li>
          <li>
            Original bookmarks are not carried over to the merged document
          </li>
          <li>The merged PDF will have basic metadata</li>
          <li>
            You can edit the metadata after merging using our Metadata Editor
            tool
          </li>
        </ul>
      </div>
    ),
    category: 'Merging',
  },
]

// PDF Metadata Editor specific FAQs
// Improved PDF Metadata Editor specific FAQs
export const metadataFAQs: FAQItem[] = [
  {
    id: 'metadata-1',
    question: 'What is PDF metadata?',
    answer: (
      <div>
        <p>
          PDF metadata is "data about data." It's a set of information hidden
          within the PDF file that describes the document's properties. This
          information isn't part of the visible content (like text or images)
          but helps software and people understand, organize, and search for the
          file.
        </p>
        <p className="mt-2">
          Think of it like the information on the back of a book cover: it tells
          you the title, author, and publisher without you having to read the
          book itself.
        </p>
      </div>
    ),
    category: 'General',
  },
  {
    id: 'metadata-2',
    question: 'Why should I edit PDF metadata?',
    answer: (
      <div>
        <p>Editing metadata is important for several reasons:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Professionalism:</strong> Ensure documents, like reports or
            CVs, correctly list you as the author and have a proper title.
          </li>
          <li>
            <strong>Search Engine Optimization (SEO):</strong> Search engines
            use metadata like the title and keywords to index and rank your PDF
            in search results.
          </li>
          <li>
            <strong>Organization:</strong> Proper metadata makes it much easier
            to search for and manage documents on your computer or in a document
            management system.
          </li>
          <li>
            <strong>Privacy:</strong> Remove personal or sensitive information
            (like the original author's name or software used) before sharing a
            document.
          </li>
          <li>
            <strong>Compliance:</strong> Some archival standards or company
            policies require specific metadata to be present and accurate.
          </li>
        </ul>
      </div>
    ),
    category: 'General',
  },
  {
    id: 'metadata-3',
    question: 'What metadata fields can I edit with this tool?',
    answer: (
      <div>
        <p>
          Our tool allows you to view and edit the core metadata fields of a
          PDF:
        </p>
        <ul className="mt-2 list-disc pl-5">
          <li>
            <strong>Title:</strong> The official title of the document.
          </li>
          <li>
            <strong>Author:</strong> The person or entity who created the
            document.
          </li>
          <li>
            <strong>Subject:</strong> A short description of the document's
            topic.
          </li>
          <li>
            <strong>Keywords:</strong> Comma-separated words to aid in
            searching.
          </li>
          <li>
            <strong>Creator:</strong> The original application used to create
            the document (e.g., "Microsoft Word").
          </li>
          <li>
            <strong>Producer:</strong> The application that converted the file
            to PDF (e.g., "Acrobat PDF Library").
          </li>
          <li>
            <strong>Creation Date:</strong> The date and time the document was
            originally created.
          </li>
          <li>
            <strong>Modification Date:</strong> The date and time the document
            was last modified.
          </li>
          <li>
            <strong>Trapped:</strong> A technical field for professional
            printing. It indicates whether the file has been processed to
            prevent small gaps between colors on a commercial printing press.
            For most users, especially for digital documents, this setting can
            be ignored.
          </li>
          <li>
            <strong>Custom Properties:</strong> Add your own unique metadata
            fields as key-value pairs. This is perfect for including internal
            information not covered by standard fields, such as "Project ID,"
            "Reviewed By," or "Department."
          </li>
        </ul>
      </div>
    ),
    category: 'Editing',
  },
  {
    id: 'metadata-4',
    question: 'Will editing the metadata change my PDF’s content?',
    answer:
      "No, absolutely not. Editing metadata only changes the document's properties. The visible content—including text, layout, fonts, and images—will remain completely untouched and identical to the original.",
    category: 'Editing',
  },
  {
    id: 'metadata-5',
    question: 'How do I remove a specific metadata field?',
    answer:
      'To remove the information from a field (like Author or Subject), simply delete all the text from its corresponding input box. When you save the PDF, that field will be cleared.',
    category: 'Editing',
  },
  {
    id: 'metadata-6',
    question: 'What is the "Trapped" metadata field?',
    answer: (
      <div>
        <p>
          The "Trapped" field is a technical property primarily used in the
          professional printing industry. It indicates whether the document has
          undergone a "trapping" process.
        </p>
        <p className="mt-2">
          Trapping is a pre-press technique that creates tiny overlaps between
          adjacent colors to prevent visible gaps from appearing if the printing
          plates are slightly misaligned.
        </p>
        <p className="mt-2">
          <strong>For most users, this field can be ignored.</strong> You
          generally do not need to change it unless you have specific
          instructions from a commercial printing service.
        </p>
      </div>
    ),
    category: 'Technical',
  },
  {
    id: 'metadata-7',
    question: "Why don't I see the updated metadata in my file browser?",
    answer: (
      <div>
        <p>
          How metadata is displayed depends on your operating system and the
          software you use. Some file explorers (like Windows Explorer or macOS
          Finder) may not immediately refresh or display all PDF metadata
          fields.
        </p>
        <p className="mt-2">
          To reliably check the updated metadata, open your edited PDF in a
          dedicated PDF reader like Adobe Acrobat Reader and go to{' '}
          <strong>File → Properties</strong>. All the changes you made will be
          visible there.
        </p>
      </div>
    ),
    category: 'Technical',
  },
  {
    id: 'metadata-8',
    question: 'Are my files secure? Do you keep my data?',
    answer:
      'We prioritize your privacy and security. Your files are processed directly in your browser. They are never uploaded to our servers, so your data remains completely private and under your control. We do not see, store, or have any access to your documents.',
    category: 'Security',
  },
]

// Combined FAQ data
export const toolCategories = [
  'General',
  'Privacy',
  'Technical',
  'Merging',
  'Editing',
]

export const getAllFAQs = (): FAQItem[] => [
  ...generalToolFAQs,
  ...mergeFAQs,
  ...metadataFAQs,
]
