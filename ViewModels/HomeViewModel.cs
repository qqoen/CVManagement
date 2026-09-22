using CVManagement.Models;

namespace CVManagement.ViewModels;

public class HomeViewModel
{
    public List<Position> LatestPositions { get; set; } = [];

    public List<Position> PopularPositions { get; set; } = [];

    public int TotalPositions { get; set; }

    public int TotalCandidates { get; set; }

    public int TotalCVs { get; set; }
}
