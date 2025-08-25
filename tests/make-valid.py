import pandas as pd
import os
from faker import Faker
import random

fake = Faker()
output_dir = "test_xlsforms_valid"  # Changed directory name
os.makedirs(output_dir, exist_ok=True)

VALID_INPUT_TYPES = [1, 2, 3, 4, 5, 6, 7]  # Example: 1=Text, 2=Select One, 3=Select Many, etc.

def generate_valid_xlsform(file_name_prefix, num_questions, num_options_per_question):
    forms_data = {
        "Language": [random.choice(["en", "fr", "es", "de"])],
        "Title": [fake.catch_phrase() + " Form"]
    }
    forms_df = pd.DataFrame(forms_data)

    questions_data = []
    for i in range(num_questions):
        question_order = i + 1
        question_type = random.choice(VALID_INPUT_TYPES)
        questions_data.append({
            "Order": question_order,
            "Title": fake.sentence(nb_words=6),
            "View Sequence": i + 1,
            "Input Type": question_type,
            "Optional Column 1": fake.word(), # Add some optional columns
            "Optional Column 2": fake.random_int(min=1, max=100)
        })
    questions_df = pd.DataFrame(questions_data)

    options_data = []
    for question_idx, question in questions_df.iterrows():
        if question["Input Type"] in [2, 3]:  # Select One or Select Many
            # Generate 3-10 options per question
            num_options_for_question = random.randint(3, 10)
            for i in range(num_options_for_question):
                # Generate a more robust label that won't be empty
                label = fake.catch_phrase().split()[0].capitalize()
                if not label or len(label) < 2:
                    label = f"Option{i+1}"

                options_data.append({
                    "Order": question["Order"],
                    "Id": i + 1,
                    "Label": label
                })
    options_df = pd.DataFrame(options_data)

    # Validate that all labels are non-empty
    if not options_df.empty:
        # Replace any empty or null labels with fallback values
        options_df['Label'] = options_df['Label'].fillna('Default Option')
        options_df.loc[options_df['Label'] == '', 'Label'] = 'Default Option'
        options_df.loc[options_df['Label'].str.len() < 2, 'Label'] = 'Default Option'

    file_path = os.path.join(output_dir, f"{file_name_prefix}.xlsx")
    with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
        forms_df.to_excel(writer, sheet_name="Forms", index=False)
        questions_df.to_excel(writer, sheet_name="Questions Info", index=False)
        options_df.to_excel(writer, sheet_name="Answer Options", index=False)

    return file_path

# Generate 9 forms with ~400 questions each
num_files_to_generate = 100
generated_files = []

for i in range(num_files_to_generate):
    file_name = f"valid_form_{i+1}"
    # Generate approximately 400 questions per form (with some variation)
    num_questions = random.randint(380, 420)  # ~400 questions with ±20 variation

    path = generate_valid_xlsform(file_name, num_questions, 10)  # Max 10 options, actual will be 3-10
    generated_files.append(path)
    print(f"Generated form {i+1}: {num_questions} questions")

print(f"\nSuccessfully generated {len(generated_files)} valid test files in '{output_dir}'")
print("Each form contains approximately 400 questions with 3-10 options per select question.")
