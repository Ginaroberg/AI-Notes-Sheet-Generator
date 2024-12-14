from flask import Flask, request, jsonify
from flask_cors import CORS
from flask import current_app as app
import io
import matplotlib.pyplot as plt
from openai import OpenAI
import pdfplumber as pdfplumber
import re as re 
import reportlab
from functools import reduce
from functools import partial
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import BaseDocTemplate, Paragraph, Frame, PageTemplate, NextPageTemplate
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename

from config import API_KEY

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "expose_headers": ["Content-Disposition"]
    }
})
# Add these configurations after creating the Flask app
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_texts_from_directory(directory_path):
    docs = []
    for filename in os.listdir(directory_path):
        file_path = os.path.join(directory_path, filename)
        if os.path.isfile(file_path):
            docs.append(extract_text_from_pdf(file_path))
    return docs

def extract_text_from_pdf(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text()
    return text

def clean_text(text):
    # Preserve math formulas
    math_formulas = re.findall(r'\$.*?\$|\\\(.*?\\\)|\\\[.*?\\\]', text)
    
    # Replace math formulas with placeholders
    for i, formula in enumerate(math_formulas):
        text = text.replace(formula, f'MATHFORMULA{i}')

    # Remove HTML tags
    text = re.sub(r'<.*?>', '', text)
    
    # Remove special characters
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    
    # Convert to lowercase
    text = text.lower()
    
    # Tokenize
    tokens = text.split()
    
    # Rejoin tokens
    cleaned_text = ' '.join(tokens)
    
    # Restore math formulas
    for i, formula in enumerate(math_formulas):
        cleaned_text = cleaned_text.replace(f'mathformula{i}', formula)
    
    return cleaned_text


def edit_sheet_with_gpt(text, edit_req, api_key=API_KEY):
    prompt = r"""The following text is my notes sheet for a class: {text}

Complete the following request on the notes sheet and output the edited complete notes sheet. Make sure to keep your response in the same format as the original notes sheet and output the full, complete original notes sheet with the included edits. Do not say anything else besides the contents of the notes sheets in your response: 

{edit_req} """
    client = OpenAI(api_key=api_key)
    out = ""
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful teaching assistant. Your task is to edit the notes sheet per the student's request and output the complete edited notes sheet. Make sure to keep your response in the same format as the original notes sheet and output the full, complete original notes sheet with the included edits. Do not say anything else besides the contents of the notes sheets in your response."},
                {"role": "user", "content":prompt.format(text=text, edit_req=edit_req)}
            ],
            max_tokens=16384,
            n=1,
            temperature=0.5,
        )

        analysis = response.choices[0].message.content.strip()
        out = analysis
    except Exception as e:
        return f"Error with OpenAI API: {str(e)}"
    
    return out

API_KEY = API_KEY
def analyze_text_for_students(text_dict, api_key = API_KEY):
    client = OpenAI(api_key=api_key)
    prompt = r"""Analyze the following text and identify exactly 15 core concepts. Format your response as a numbered list of concepts with their explanations. Use clear, simple language suitable for students.

Text to analyze:
{text}

For each concept, provide:
1. A concise definition (20-30 words)
2. Exactly 2 key points or applications (15-25 words each)

Use this exact format for each concept:

n. Concept Name:
   - Definition: [20-30 word definition]
   - Key points:
     • [15-25 word key point or application]
     • [15-25 word key point or application]
     • [15-25 word key point or application]
     

Include relevant mathematical notations where appropriate, using LaTeX formatting (e.g., \(f(x) = wx + b\)).

Focus on fundamental ideas in text classification, machine learning, and natural language processing.

Example format:
1. Neural Networks:
   - Definition: Computational models inspired by biological neural networks, consisting of interconnected nodes (neurons) that process and transmit information.
   - Key points:
     • Used in various machine learning tasks, including image recognition and natural language processing.
     • Employ backpropagation algorithm for training, adjusting weights to minimize error between predicted and actual outputs.

[Repeat this format for all 15 concepts]
    """
    for name,text in text_dict.items():
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful teaching assistant. Your task is to analyze the given text, identify core concepts, and provide detailed explanations to help students understand these concepts."},
                    {"role": "user", "content":prompt.format(text=text)}
                ],
                max_tokens=16384,
                n=1,
                temperature=0.5,
            )

            analysis = response.choices[0].message.content.strip()
            text_dict[name] = analysis
        except Exception as e:
            return f"Error with OpenAI API: {str(e)}"
    return text_dict

def extract_numbered_list(text_dicts):
    out = {}
    for name,text in text_dicts.items():
        pattern = r'(\d+)\.\s+([^:\n]+):\n\s*- Definition:\s*([^\n]+)\n\s*- Key points:\n\s*•\s*([^\n]+)\n\s*•\s*([^\n]+)'
        
        matches = re.findall(pattern, text, re.MULTILINE)
        
        result = ""
        for number, title, definition, point1, point2 in matches:
            result += f"{number}. {title}:\n"
            result += f"   - Definition: {definition}\n"
            result += f"   - Key points:\n"
            result += f"     • {point1}\n"
            result += f"     • {point2}\n\n"
        
        #out.append(result.strip())

        out[name] = result.strip()
    return out
    
def clean_text(text):
    text = text.replace('&', '&amp;')
    text = text.replace('<', '&lt;')
    text = text.replace('>', '&gt;')
    text = text.replace('\\(', '')
    text = text.replace('\\)', '')
    text = text.replace('\\[', '')
    text = text.replace('\\]', '')
    return text

def create_columned_pdf(output_filename, text_dicts, num_columns=2, pg_count = 1, selected_topics = False):
    # Use BaseDocTemplate instead of SimpleDocTemplate
    doc = BaseDocTemplate(output_filename, pagesize=letter,
                         leftMargin=1, rightMargin=1, 
                         topMargin=1, bottomMargin=1)

    styles = getSampleStyleSheet()
    total_words = sum(len(text_dicts[content].split()) for content in text_dicts.keys() if text_dicts[content].strip())
    #print(total_words)

    if total_words <= 800:
        font_size =  10  # Maximum font size
        leading = font_size + 2
    elif total_words >= 2000:
        font_size = 3  # Minimum font size
        leading = font_size + 1
    else:
        # Linear scaling between 800 and 2000 words
        slope = -0.005  # Decrease in font size per word
        font_size = 10 + (slope * (total_words - 800))

    leading = font_size + 2

    styles['Normal'].fontSize = font_size
    styles['Normal'].leading = leading
    styles['Normal'].leftIndent = 0
    styles['Normal'].spaceBefore = 0
    styles['Normal'].spaceAfter = 0

    
    #highlighted style
    styles.add(ParagraphStyle(name='Highlight',
                            parent=styles['Normal'],
                            backColor=colors.yellow))
        
    # Title style
    styles.add(ParagraphStyle(
        name='CustomTitle',
        parent=styles['Normal'],
        fontSize=font_size,
        leading=leading,
        leftIndent=0,
        bold=True,
        spaceBefore=0,
        spaceAfter=0
    ))
    
    def process_paragraph(p, styles):
        elements = []
        print('process paragraph input --------------------------------')
        print(p)
        if not selected_topics:
            sections = p.split('\n\n')
        else:
            #sections = re.split(r'(?<=\.)\s*(?=\d\.)', p)
            sections = re.split(r'(?:^|\n)(?=\d+\.\s)', p)
            print(re.findall(r'(?:^|\n)(?=\d+\.\s)', p))

        
        for section in sections:
            print(section)
            print('-----------------------')
            if not section.strip():
                continue
                
            match = re.match(r'(\d+\.\s*[^:]+):', section)
            if match:
                print(match)
                title = clean_text(match.group(1))
                highlighted_text = f'<span backColor="yellow">{title}:</span>'
                elements.append(Paragraph(highlighted_text, styles['Normal']))
                
                content = section[match.end():].strip()
                parts = content.split('- Key points:')
                
                if len(parts) > 1:
                    definition = clean_text(parts[0].replace('- Definition:', '').strip())
                    elements.append(Paragraph(f"<b>Definition:</b> {definition}", 
                                           styles['Normal']))
                    
                    elements.append(Paragraph("<b>Key points:</b>", 
                                           styles['Normal']))
                    
                    key_points = parts[1].strip().split('•')
                    for point in key_points:
                        if point.strip():
                            cleaned_point = clean_text(point.strip())
                            elements.append(Paragraph(f"• {cleaned_point}", 
                                                   styles['Normal']))
        return elements
    
    # Process content
    elements = []
    for name,content in text_dicts.items():
        print('--------------')
        print(name)
        print(content)
        if content.strip():
            elements.extend(process_paragraph(content, styles))
            # Add NextPageTemplate to maintain two-column layout
            elements.append(NextPageTemplate('TwoCol'))
    
    # Set up frames
    page_width, page_height = letter
    frame_width = (page_width - 20) / num_columns
    frames = []
    
    for i in range(num_columns):
        x = 10 + (i * frame_width)
        frame = Frame(x, 10,
                     frame_width, page_height - 20,
                     leftPadding=5, bottomPadding=5,
                     rightPadding=5, topPadding=5)
        frames.append(frame)
    
    # Create template and build
    template = PageTemplate(id='TwoCol', frames=frames)
    doc.addPageTemplates(template)
    doc.build(elements)

def find_topics(text_dicts):
        # Regular expression pattern to match numbered titles
    out = {}
    for name,text in text_dicts.items():
        pattern = r'^\d+\.\s(.+?):'

        # Find all matches in the text
        matches = re.findall(pattern, text, re.MULTILINE)
        out[name] = matches
        
    return out

def text_to_dict(text_dicts):
     # Regular expression pattern to extract titles and their content
    out = {}
    for name,text in text_dicts.items():
        pattern = r'(\d+\.\s*)(.+?):\s*((?:(?!^\d+\.).)+)'

        # Find all matches in the text
        matches = re.findall(pattern, text, re.MULTILINE | re.DOTALL)
        # Create a dictionary from the matches
        result_dict = {title.strip(): f"{number}{title.strip()}:" + "\n" + content.strip() 
                       for number, title, content in matches}
        
        out[name] = result_dict
        
    return out
def get_selected_values(dict_of_dicts, selected_keys):
    #print(f"Total selected keys: {len(selected_keys)}")
    #print(f"Selected keys: {selected_keys}")

    result = {}
    matched_keys = set()
    unmatched_keys = set()

    for pdf_name, inner_dict in dict_of_dicts.items():
        result[pdf_name] = ""
        for key in selected_keys:
            if key in inner_dict:
                result[pdf_name] += ("\n" + inner_dict[key])
                matched_keys.add(key)
                # print(f"Matched key in {pdf_name}: {key}")
            else:
                unmatched_keys.add(key)
                #print(f"Unmatched key in {pdf_name}: {key}")

    # print(f"Total matched keys: {len(matched_keys)}")
    # print(f"Matched keys: {matched_keys}")
    # print(f"Total unmatched keys: {len(unmatched_keys)}")
    # print(f"Unmatched keys: {unmatched_keys}")
    # print(result)
    return result


    # return {
    #     pdf_name: "".join(inner_dict.get(key, " ") for key in selected_keys)
    #     for pdf_name, inner_dict in dict_of_dicts.items()
    # }
app.config['extracted_texts'] = {}
app.config['analyzed_texts'] = {}
app.config['dict_of_dicts'] = {}

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'files' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    files = request.files.getlist('files')
    saved_files = []
    
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            saved_files.append(filename)
    
    if not saved_files:
        return jsonify({'error': 'No valid PDF files uploaded'}), 400
    # Extract text from uploaded PDFs
    docs = []
    names = []
    for filename  in saved_files:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        docs.append(extract_text_from_pdf(file_path))
        names.append(filename)
    names_doc_dict = dict(zip(names, docs))
    # Clean the extracted text
    for filename, text in names_doc_dict.items():
        transformed_text = clean_text(text)
        names_doc_dict[filename] = transformed_text
    
    # Analyze the cleaned text
    api_key = API_KEY  # Replace with your actual API key
    
    analyzed_texts = analyze_text_for_students(names_doc_dict, api_key)
    
    # Extract numbered list from analyzed texts
    extracted_texts = extract_numbered_list(analyzed_texts)
    
    #look for selected values if there are any
    #selected_keys = get topics from user query 
    # if not selected_keys:
    #     extracted_texts = get_selected_values(list_of_dicts,selected_keys)
    # Create the PDF
    output_filename = 'output.pdf'
    create_columned_pdf(output_filename, extracted_texts)
    
    # Clean up uploaded files
    for filename in saved_files:
        try:
            os.remove(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        except:
            pass
    
    # Return the generated PDF
    return send_file(output_filename, mimetype='application/pdf')

@app.route('/topics', methods = ['POST'])
def topics():
    if 'files' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    files = request.files.getlist('files')
    saved_files = []
    
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            saved_files.append(filename)
    
    if not saved_files:
        return jsonify({'error': 'No valid PDF files uploaded'}), 400
    # Extract text from uploaded PDFs
    docs = []
    names = []
    for filename  in saved_files:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        docs.append(extract_text_from_pdf(file_path))
        names.append(filename)
    names_doc_dict = dict(zip(names, docs))

    # Clean the extracted text
    for filename, text in names_doc_dict.items():
        transformed_text = clean_text(text)
        names_doc_dict[filename] = transformed_text
    
    # Analyze the cleaned text
    api_key = API_KEY 
    
    analyzed_texts = analyze_text_for_students(names_doc_dict, api_key)
    
    # Extract numbered list from analyzed texts
    extracted_texts = extract_numbered_list(analyzed_texts)


    dict_of_dicts = text_to_dict(extracted_texts)

    app.config['extracted_texts'] = extracted_texts
    app.config['analyzed_texts'] = analyzed_texts
    app.config['dict_of_dicts'] = dict_of_dicts
    return find_topics(extracted_texts)


@app.route('/download', methods = ['POST'])
def download():
    data = request.get_json()
    selected_keys = []

    for key,value in data.items():
        selected_keys.extend(value)

    total_inner_pairs = sum(len(inner_dict) for inner_dict in app.config['dict_of_dicts'].values())
    
    selected_topics_text= get_selected_values(app.config['dict_of_dicts'],selected_keys)
   
    if all(not v for v in data.values()):
         output_filename = "output_no_topics_selected"
         print("HERE")
         create_columned_pdf(output_filename, app.config['extracted_texts'])
    else :
         output_filename = "output_topics_selected"
         create_columned_pdf(output_filename, selected_topics_text, selected_topics = True)
    
    return send_file(output_filename, mimetype='application/pdf')

@app.route('/issue', methods=['POST'])
def edit_issue():
    data = request.get_json()
    notes = " ".join(app.config['extracted_texts'].values())
    out = edit_sheet_with_gpt(notes, data["issue"], api_key=API_KEY)
    edited_text = {"edited": out}

    print(out)
    output_filename = "edited"
    create_columned_pdf(output_filename, edited_text)
    
    return send_file(output_filename, mimetype='application/pdf')
if __name__ == '__main__':
    app.run(debug=True)