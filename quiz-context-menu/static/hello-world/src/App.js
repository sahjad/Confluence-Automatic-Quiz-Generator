import React, { useEffect, useState } from "react";
import { invoke, view } from "@forge/bridge";
import jsPDF from "jspdf";

function App() {
  const [contentId, setContentId] = useState(null);
  const [quizData, setQuizData] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [reviewData, setReviewData] = useState(null);
  const [customizeOptionsVisible, setCustomizeOptionsVisible] = useState(false);
  const [contentLength, setContentLength] = useState(0);
  const [questionType, setQuestionType] = useState();
  const [numQuestions, setNumQuestions] = useState();
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch contentId using view.getContext
  useEffect(() => {
    async function fetchContext() {
      const context = await view.getContext();
      if (context.extension && context.extension.content) {
        setContentId(context.extension.content.id);
      }
    }
    fetchContext();
  }, []);

  // Fetch content length for customization options
  const handleCustomize = () => {
    if (contentId) {
      invoke("getCustomizationOptions", { contentId })
        .then(({ length }) => {
          if (length < 250) {
            setErrorMessage("Minimum 250 words required to generate a quiz.");
          } else {
            setContentLength(length);
            setCustomizeOptionsVisible(true);
            // Set default values based on content length if they haven't been set
            if (!numQuestions) {
              setNumQuestions(length >= 1000 ? 15 : length >= 500 ? 10 : 5);
            }
            if (!questionType) {
              setQuestionType("MCQ"); // Set default type to Multiple Choice
            }
          }
        })
        .catch((err) =>
          console.error("Error fetching customization options:", err)
        );
    }
  };

  // Function to handle Start Quiz button click
  const handleStartQuiz = () => {
    setLoading(true);
    setQuizStarted(false);
    const payload = { contentId, numQuestions, questionType };

    console.log(payload);

    invoke("getText", payload)
      .then((response) => {
        if (
          response.response === "Minimum 250 words required to generate a quiz."
        ) {
          // Display error message if content length is too short
          setErrorMessage("Minimum 250 words required to generate a quiz.");
          setLoading(false);
        } else {
          const quiz = JSON.parse(response.response); // Parse the response as JSON
          setQuizData(quiz.questions); // Store the quiz questions
          setNumQuestions(response.numQuestions);
          setLoading(false);
          setQuizStarted(true);
          setErrorMessage("");
        }
      })
      .catch((err) => {
        console.error("Error fetching quiz:", err);
        setLoading(false);
      });
  };

  // Handle option selection
  const handleSelectAnswer = (answer) => {
    setSelectedAnswer(answer);
  };

  // Handle submit logic
  const handleSubmit = () => {
    setSubmitted(true);
    const correctAnswer = quizData[currentQuestion].correctAnswer;
    setUserAnswers([
      ...userAnswers,
      {
        question: quizData[currentQuestion].question,
        selectedAnswer,
        correctAnswer,
      },
    ]);
    if (selectedAnswer === correctAnswer) {
      setScore(score + 1); // Increment score for correct answer
    }
  };

  // Handle moving to the next question
  const handleNextQuestion = () => {
    setSubmitted(false);
    setSelectedAnswer(null);
    setCurrentQuestion(currentQuestion + 1);
  };

  // Handle finishing the quiz
  const handleFinishQuiz = () => {
    const finalScore = (score / numQuestions) * 100;
    console.log("Final Score:", finalScore);

    if (finalScore >= 70) {
      // Show congrats screen if score is >= 70%
      setShowResults("congrats");
    } else {
      // Show retake screen if score is less than 70%
      setShowResults("retake");
    }
  };

  const handleReview = () => {
    setReviewData(quizData);
  };

  // Handle retake action
  const handleRetake = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setSubmitted(false);
    setScore(0);
    setUserAnswers([]);
    setShowResults(false);
    setQuizStarted(true);
    setReviewData(null);
    setCustomizeOptionsVisible(false);
  };

  // Copy review content to clipboard
  const handleCopyToClipboard = () => {
    const reviewText = reviewData
      .map(
        (question, index) =>
          `Question ${index + 1}: ${question.question}\nCorrect Answer: ${
            question.correctAnswer
          }\nYour Answer: ${
            userAnswers[index]
              ? userAnswers[index].selectedAnswer
              : "Not Answered"
          }\n\n`
      )
      .join("");
    navigator.clipboard.writeText(reviewText);
    alert("Review content copied to clipboard!");
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const lineHeight = 10;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    let y = 20;

    // Title
    doc.setFontSize(18);
    doc.text("Quiz Review", margin, y);
    y += 15;

    // Quiz Review Content
    doc.setFontSize(12);
    reviewData.forEach((question, index) => {
      const questionText = `Question ${index + 1}: ${question.question}`;
      const correctAnswer = `Correct Answer: ${question.correctAnswer}`;
      const userAnswer = `Your Answer: ${
        userAnswers[index] ? userAnswers[index].selectedAnswer : "Not Answered"
      }`;

      // Split text into lines that fit within the page width
      const questionLines = doc.splitTextToSize(
        questionText,
        pageWidth - 2 * margin
      );
      const correctAnswerLines = doc.splitTextToSize(
        correctAnswer,
        pageWidth - 2 * margin
      );
      const userAnswerLines = doc.splitTextToSize(
        userAnswer,
        pageWidth - 2 * margin
      );

      // Add each line of the question text to the PDF, checking for page overflow
      questionLines.forEach((line) => {
        if (y + lineHeight > pageHeight) {
          doc.addPage();
          y = margin; // Reset y position on the new page
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });

      // Add each line of the correct answer text to the PDF
      correctAnswerLines.forEach((line) => {
        if (y + lineHeight > pageHeight) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });

      // Add each line of the user answer text to the PDF
      userAnswerLines.forEach((line) => {
        if (y + lineHeight > pageHeight) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });

      y += 5; // Extra space after each question block
    });

    // Save the PDF
    doc.save("Quiz_Review.pdf");
  };

  const handleQuit = () => {
    setQuizData([]);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setSubmitted(false);
    setScore(0);
    setUserAnswers([]);
    setShowResults(false);
    setQuizStarted(false);
    setReviewData(null);
    setLoading(false);
    setNumQuestions(undefined);
    setQuestionType(undefined);
    setCustomizeOptionsVisible(false);
  };

  const currentQuizQuestion = quizData[currentQuestion];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Quiz Time!</h1>

      {!reviewData && !quizStarted && (
        <div style={styles.startContainer}>
          <p style={styles.subtitle}>
            This quiz is based on the contents of this page
          </p>
          {errorMessage && <p style={styles.errorMessage}>{errorMessage}</p>}
          <img
            src="./images/quiz-image-svg.svg"
            alt="Quiz"
            style={styles.startImage}
          />

          <p style={styles.score}>Score 70% to pass</p>

          <button
            style={{
              ...styles.customizeButton,
              marginRight: customizeOptionsVisible ? "0px" : "30px",
            }}
            onClick={handleCustomize}
            disabled={loading}
          >
            Customize Quiz
          </button>

          {customizeOptionsVisible && (
            <div style={styles.customizeContainer}>
              <div style={styles.optionGroup}>
                <label style={styles.label}>Number of Questions:</label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  style={styles.select}
                >
                  <option value="5">5</option>
                  {contentLength >= 500 && <option value="10">10</option>}
                  {contentLength >= 1000 && <option value="15">15</option>}
                </select>
              </div>
              <div style={styles.optionGroup}>
                <label style={styles.label}>Type of Questions:</label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  style={styles.select}
                >
                  <option value="MCQ">Multiple Choice</option>
                  <option value="TF">True/False</option>
                </select>
              </div>
            </div>
          )}

          <button
            style={styles.startButton}
            onClick={handleStartQuiz}
            disabled={loading}
          >
            Start Quiz
          </button>
        </div>
      )}

      {loading && <p>Loading quiz...</p>}

      {!loading && quizData.length > 0 && quizStarted && !showResults && (
        <div>
          <p style={styles.question}>{`Question ${currentQuestion + 1}: ${
            currentQuizQuestion.question
          }`}</p>
          <div style={styles.optionsContainer}>
            {currentQuizQuestion.options.map((option, index) => (
              <div
                key={index}
                onClick={() => {
                  if (!submitted) handleSelectAnswer(option);
                }}
                style={{
                  ...styles.option,
                  backgroundColor: getOptionColor(
                    option,
                    currentQuizQuestion.correctAnswer,
                    selectedAnswer,
                    submitted
                  ),
                }}
              >
                {option}
              </div>
            ))}
          </div>

          <button
            style={styles.submitButton}
            onClick={handleSubmit}
            disabled={!selectedAnswer || submitted}
          >
            Submit
          </button>

          {currentQuestion < quizData.length - 1 ? (
            <button
              style={styles.nextButton}
              onClick={handleNextQuestion}
              disabled={!submitted}
            >
              Next
            </button>
          ) : (
            <button
              style={styles.finishButton}
              onClick={handleFinishQuiz}
              disabled={!submitted}
            >
              Finish
            </button>
          )}

          <p>{`${currentQuestion + 1}/${quizData.length}`}</p>
        </div>
      )}

      {/* Show Congrats or Retake screen based on the score */}
      {showResults === "congrats" && !reviewData && (
        <div style={styles.resultContainer}>
          <h2>
            Passed! You have scored {score}/{quizData.length}
          </h2>
          <img
            src="./images/congrats.svg"
            alt="Congrats"
            style={styles.resultImage}
          />
          <button style={styles.resultButton} onClick={handleReview}>
            Review
          </button>
          <button style={styles.resultButton} onClick={handleQuit}>
            Quit
          </button>
        </div>
      )}

      {showResults === "retake" && !reviewData && (
        <div style={styles.resultContainer}>
          <h2>
            Oops! You have failed. Score: {score}/{quizData.length}
          </h2>
          <p>Please Re-take the quiz.</p>
          <img
            src="./images/retake.svg"
            alt="Retake"
            style={styles.resultImage}
          />
          <button style={styles.resultButton} onClick={handleRetake}>
            Re-take
          </button>
          <button style={styles.resultButton} onClick={handleReview}>
            Review
          </button>
        </div>
      )}

      {reviewData && (
        <div style={styles.reviewContainer}>
          <h2>Quiz Review</h2>
          {reviewData.map((question, index) => (
            <div key={index} style={styles.reviewItem}>
              <p>
                <strong>Question {index + 1}:</strong> {question.question}
              </p>
              <p>
                <strong>Correct Answer:</strong> {question.correctAnswer}
              </p>
              <p>
                <strong>Your Answer:</strong>{" "}
                {userAnswers[index]
                  ? userAnswers[index].selectedAnswer
                  : "Not Answered"}
              </p>
            </div>
          ))}
        </div>
      )}
      {reviewData && (
        <div style={{ display: "flex", flexDirection: "row" }}>
          {showResults != "congrats" && (
            <button style={styles.resultButton} onClick={handleRetake}>
              Re-take
            </button>
          )}
          <button style={styles.resultButton} onClick={handleCopyToClipboard}>
            Copy to Clipboard
          </button>
          <button style={styles.resultButton} onClick={handleDownloadPDF}>
            Download as PDF
          </button>
          <button
            style={styles.resultButton}
            onClick={() => setReviewData(null)}
          >
            Close Review
          </button>
        </div>
      )}
    </div>
  );
}

// Correctly highlight selected and correct answers
const getOptionColor = (option, correctAnswer, selectedAnswer, submitted) => {
  if (!submitted) {
    return selectedAnswer === option ? "#49B3FF" : "#fff"; // Blue for selected, white for others
  }

  if (submitted) {
    if (option === correctAnswer) {
      return "#18F721"; // Green for correct answer
    }
    if (option === selectedAnswer && option !== correctAnswer) {
      return "#EF1C1C"; // Red for wrong answer
    }
  }
  return "#fff";
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    height: "100vh",
    backgroundColor: "#f4f6f8",
    borderRadius: "10px",
    margin: "0 auto",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    paddingLeft: "40px",
    paddingRight: "40px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  startContainer: {
    textAlign: "center",
    marginTop: "20px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#555",
    marginBottom: "20px",
  },
  startImage: {
    width: "100%",
    maxWidth: "300px",
    marginBottom: "20px",
    height: "150px",
    marginTop: "20px",
  },
  score: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "20px",
  },
  startButton: {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#4f74f9",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginTop: "20px",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#4f74f9",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginTop: "20px",
  },
  optionsContainer: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "20px",
  },
  option: {
    padding: "15px",
    margin: "8px 0",
    border: "1px solid #ddd",
    borderRadius: "30px",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    transition: "background-color 0.3s ease",
    fontSize: "16px",
    backgroundColor: "#fff",
  },
  submitButton: {
    padding: "10px 20px",
    backgroundColor: "#4f74f9",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginRight: "10px",
  },
  nextButton: {
    padding: "10px 20px",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  finishButton: {
    padding: "10px 20px",
    backgroundColor: "#FF5733",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  resultContainer: {
    textAlign: "center",
    backgroundColor: "#f4f6f8",
    borderRadius: "10px",
    maxWidth: "500px",
    margin: "40px auto",
  },
  resultImage: {
    width: "150px",
    margin: "30px auto",
    display: "block",
  },
  resultButton: {
    padding: "10px 20px",
    backgroundColor: "#4f74f9",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    margin: "10px",
    cursor: "pointer",
  },
  question: {
    fontSize: "18px",
    fontWeight: "bold",
    marginTop: "20px",
    marginBottom: "20px",
  },
  reviewContainer: {
    textAlign: "left",
    backgroundColor: "#f4f6f8",
    borderRadius: "10px",
    maxWidth: "600px",
    maxHeight: "70vh",
    margin: "20px auto",
    padding: "20px",
    overflowY: "auto",
  },
  reviewItem: {
    marginTop: "20px",
  },
  customizeButton: {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#4f74f9",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginTop: "20px",
  },
  customizeContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginTop: "15px",
  },
  optionGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  label: {
    fontSize: "14px",
    marginBottom: "5px",
    color: "#555",
  },
  select: {
    padding: "5px 10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    color: "darkslategrey",
  },
  errorMessage: {
    color: "red",
    fontSize: "14px",
    marginTop: "10px",
  },
};

export default App;
