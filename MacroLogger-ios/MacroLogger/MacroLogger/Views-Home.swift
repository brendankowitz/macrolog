import SwiftUI

// MARK: - Home View
struct HomeView: View {
    @StateObject private var viewModel = HomeViewModel()
    @State private var showCameraView = false
    @State private var selectedImage: UIImage?
    @State private var showMealAnalysis = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color(UIColor(red: 0.976, green: 0.98, blue: 0.988, alpha: 1)).ignoresSafeArea()

                if viewModel.isLoading {
                    VStack {
                        ProgressView()
                        Text("Loading...")
                            .foregroundColor(.gray)
                            .padding(.top)
                    }
                } else {
                    ScrollView {
                        VStack(spacing: 24) {
                            // Header
                            VStack(alignment: .leading, spacing: 4) {
                                Text("MacroLog")
                                    .font(.system(size: 32, weight: .bold))
                                    .foregroundColor(.black)
                                Text("Snap, analyze, track")
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal)

                            // Streak Badge
                            if viewModel.currentStreak > 0 {
                                HStack {
                                    Text("🔥 \(viewModel.currentStreak) day streak")
                                        .font(.system(weight: .semibold))
                                        .foregroundColor(Color(red: 0.573, green: 0.251, blue: 0.008))
                                }
                                .frame(maxWidth: .infinity)
                                .padding(12)
                                .background(Color(red: 0.996, green: 0.953, blue: 0.78))
                                .cornerRadius(12)
                                .padding(.horizontal)
                            }

                            // API Key Warning
                            if viewModel.settings.openai_api_key == nil {
                                HStack(alignment: .top, spacing: 12) {
                                    Text("⚠️")
                                        .font(.system(size: 24))
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("API Key Required")
                                            .font(.system(weight: .semibold))
                                            .foregroundColor(Color(red: 0.573, green: 0.251, blue: 0.008))
                                        Text("Add your OpenAI API key in Settings to enable food analysis")
                                            .font(.subheadline)
                                            .foregroundColor(Color(red: 0.573, green: 0.251, blue: 0.008))
                                    }
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(16)
                                .background(Color(red: 0.996, green: 0.953, blue: 0.78))
                                .cornerRadius(16)
                                .padding(.horizontal)
                            }

                            // Camera Button
                            NavigationLink(destination: MealCameraView(viewModel: viewModel)) {
                                HStack(spacing: 16) {
                                    Text("📸")
                                        .font(.system(size: 40))
                                    VStack(alignment: .leading) {
                                        Text("Take Photo")
                                            .font(.system(size: 24, weight: .bold))
                                            .foregroundColor(.white)
                                        Text("Analyze your meal")
                                            .font(.subheadline)
                                            .foregroundColor(Color(red: 0.878, green: 0.906, blue: 1))
                                    }
                                    Spacer()
                                }
                                .padding(24)
                                .background(Color(red: 0.235, green: 0.51, blue: 0.961))
                                .cornerRadius(24)
                                .padding(.horizontal)
                            }

                            // Today's Stats
                            let todayTotals = viewModel.getTodaysTotals()
                            let todayMeals = viewModel.getTodaysMeals()

                            if !todayMeals.isEmpty {
                                VStack(spacing: 16) {
                                    // Stats Header
                                    HStack {
                                        Text("TODAY")
                                            .font(.system(size: 12, weight: .semibold))
                                            .tracking(1)
                                            .foregroundColor(.gray)
                                        Spacer()
                                        if todayTotals.avgHealthScore > 0 {
                                            HStack(spacing: 4) {
                                                Text(getHealthScoreEmoji(todayTotals.avgHealthScore))
                                                Text("\(todayTotals.avgHealthScore)")
                                                    .font(.system(weight: .semibold))
                                                    .foregroundColor(.green)
                                            }
                                        }
                                    }
                                    .padding(.horizontal)

                                    // Stats Grid
                                    HStack(spacing: 16) {
                                        VStack(alignment: .leading, spacing: 8) {
                                            Text("\(todayTotals.calories)")
                                                .font(.system(size: 28, weight: .bold))
                                                .foregroundColor(Color(red: 0.235, green: 0.51, blue: 0.961))
                                            Text("Calories")
                                                .font(.subheadline)
                                                .foregroundColor(Color(red: 0.295, green: 0.334, blue: 0.388))
                                            Text("of \(viewModel.settings.daily_goals.calories)")
                                                .font(.caption)
                                                .foregroundColor(.gray)
                                        }
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                        .padding(16)
                                        .background(Color(red: 0.94, green: 0.965, blue: 1))
                                        .cornerRadius(12)

                                        VStack(alignment: .leading, spacing: 8) {
                                            Text("\(todayTotals.protein)g")
                                                .font(.system(size: 28, weight: .bold))
                                                .foregroundColor(Color(red: 0.235, green: 0.51, blue: 0.961))
                                            Text("Protein")
                                                .font(.subheadline)
                                                .foregroundColor(Color(red: 0.295, green: 0.334, blue: 0.388))
                                            Text("of \(viewModel.settings.daily_goals.protein)g")
                                                .font(.caption)
                                                .foregroundColor(.gray)
                                        }
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                        .padding(16)
                                        .background(Color(red: 0.94, green: 0.965, blue: 1))
                                        .cornerRadius(12)
                                    }
                                    .padding(.horizontal)
                                }
                                .padding(20)
                                .background(.white)
                                .cornerRadius(16)
                                .padding(.horizontal)

                                // Recent Meals
                                VStack(alignment: .leading, spacing: 12) {
                                    HStack {
                                        Text("Recent")
                                            .font(.system(size: 18, weight: .bold))
                                            .foregroundColor(.black)
                                        Spacer()
                                        NavigationLink("See all") {
                                            ProgressView()
                                        }
                                        .font(.subheadline)
                                        .foregroundColor(Color(red: 0.235, green: 0.51, blue: 0.961))
                                    }
                                    .padding(.horizontal)

                                    ForEach(todayMeals.prefix(3)) { meal in
                                        MealCardView(meal: meal)
                                    }
                                }
                                .padding(.horizontal)
                            } else if viewModel.settings.openai_api_key != nil {
                                // Empty State
                                VStack(spacing: 16) {
                                    Text("📸")
                                        .font(.system(size: 48))
                                    Text("Ready to start tracking")
                                        .font(.system(size: 18, weight: .semibold))
                                        .foregroundColor(.black)
                                    Text("Take a photo of your meal and let AI identify the nutrition")
                                        .font(.subheadline)
                                        .foregroundColor(.gray)
                                        .multilineTextAlignment(.center)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(32)
                                .background(.white)
                                .cornerRadius(16)
                                .padding(.horizontal)
                            }

                            Spacer(minLength: 100)
                        }
                    }
                }
            }
            .navigationTitle("")
            .navigationBarHidden(true)
            .onAppear {
                viewModel.loadData()
            }
        }
    }
}

// MARK: - Meal Card Component
struct MealCardView: View {
    let meal: Meal

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    Text("\(meal.items.count) items")
                        .font(.system(weight: .semibold))
                        .foregroundColor(.black)
                    if let score = meal.healthScore as Int? {
                        Text(getHealthScoreEmoji(score))
                    }
                }
                Text(formatTimeDisplay(meal.timestamp))
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                Text("\(meal.totalCalories)")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(Color(red: 0.235, green: 0.51, blue: 0.961))
                Text("cal")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
        }
        .padding(12)
        .background(.white)
        .cornerRadius(16)
    }
}

#Preview {
    HomeView()
}
