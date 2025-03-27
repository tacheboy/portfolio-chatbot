import PyPDF2
import json
import nltk
from sentence_transformers import SentenceTransformer

def extract_text_from_pdf(pdf_path):
    text = ""
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def split_text_into_chunks(text, max_chunk_size=500):
    # Split the text into sentences
    sentences = nltk.tokenize.sent_tokenize(text, language='english')
    chunks = []
    current_chunk = ""
    for sentence in sentences:
        # If adding the sentence exceeds the chunk size, start a new chunk
        if len(current_chunk) + len(sentence) > max_chunk_size:
            chunks.append(current_chunk.strip())
            current_chunk = sentence
        else:
            current_chunk += " " + sentence
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

def generate_embeddings(chunks):
    model = SentenceTransformer('all-MiniLM-L6-v2')
    embeddings = model.encode(chunks)
    # Convert numpy arrays to lists for JSON serialization
    return [emb.tolist() for emb in embeddings]

def main():
    pdf_path = "Tushar_CV.pdf"  # Path to your resume PDF
    output_file = "resume_chunks.json"

    # Extract text from the PDF
    text = extract_text_from_pdf(pdf_path)
    if not text:
        print("No text found in PDF.")
        return

    # Split text into manageable chunks
    chunks = split_text_into_chunks(text)
    print(f"Extracted {len(chunks)} chunks from the resume.")

    # Generate embeddings for each chunk
    embeddings = generate_embeddings(chunks)
    print("Generated embeddings for all chunks.")

    # Combine chunks and embeddings into a list of objects
    resume_data = [{"chunk": chunk, "embedding": emb} for chunk, emb in zip(chunks, embeddings)]

    # Save to a JSON file
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(resume_data, f, indent=2)
    print(f"Resume data saved to {output_file}.")

if __name__ == "__main__":
    main()
