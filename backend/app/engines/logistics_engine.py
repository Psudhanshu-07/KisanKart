import datetime
import uuid
from typing import Any, Dict, List, Optional

from ortools.constraint_solver import pywrapcp, routing_enums_pb2


class LogisticsOptimisationEngine:
    """Capacity and freshness ordering for routes built from real records."""

    @classmethod
    def solve_or_tools_route(
        cls,
        distance_matrix: List[List[int]],
        demands: List[int],
        vehicle_capacity: int,
    ) -> Optional[List[int]]:
        try:
            manager = pywrapcp.RoutingIndexManager(len(distance_matrix), 1, 0)
            routing = pywrapcp.RoutingModel(manager)

            def distance_callback(from_index: int, to_index: int) -> int:
                return distance_matrix[manager.IndexToNode(from_index)][manager.IndexToNode(to_index)]

            transit_index = routing.RegisterTransitCallback(distance_callback)
            routing.SetArcCostEvaluatorOfAllVehicles(transit_index)

            def demand_callback(from_index: int) -> int:
                return demands[manager.IndexToNode(from_index)]

            demand_index = routing.RegisterUnaryTransitCallback(demand_callback)
            routing.AddDimensionWithVehicleCapacity(demand_index, 0, [vehicle_capacity], True, "Capacity")
            parameters = pywrapcp.DefaultRoutingSearchParameters()
            parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
            solution = routing.SolveWithParameters(parameters)
            if not solution:
                return None

            index = routing.Start(0)
            plan = []
            while not routing.IsEnd(index):
                plan.append(manager.IndexToNode(index))
                index = solution.Value(routing.NextVar(index))
            plan.append(manager.IndexToNode(index))
            return plan
        except Exception:
            return None

    @classmethod
    def generate_optimised_route(
        cls,
        driver_id: int,
        pickups: List[Dict[str, Any]],
        destination: Dict[str, Any],
        vehicle_capacity_kg: float = 1000.0,
    ) -> Dict[str, Any]:
        priority_weights = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
        sorted_pickups = sorted(
            pickups,
            key=lambda item: priority_weights.get(item.get("freshness_priority", "MEDIUM"), 1),
        )
        stops = []
        current_load = 0.0
        current_time = datetime.datetime.now().replace(second=0, microsecond=0)

        for sequence, pickup in enumerate(sorted_pickups, start=1):
            quantity = float(pickup["quantity_kg"])
            current_load += quantity
            stops.append({
                "stop_sequence": sequence,
                "stop_type": pickup.get("type", "PICKUP"),
                "location_name": pickup["location_name"],
                "scheduled_time": current_time.strftime("%Y-%m-%d %H:%M"),
                "quantity_kg": quantity,
                "cumulative_load_kg": round(current_load, 2),
                "contact_name": pickup.get("contact_name"),
                "contact_phone": pickup.get("contact_phone"),
                "status": "PENDING",
            })
            current_time += datetime.timedelta(minutes=40)

        stops.append({
            "stop_sequence": len(stops) + 1,
            "stop_type": "DELIVERY",
            "location_name": destination["location_name"],
            "scheduled_time": current_time.strftime("%Y-%m-%d %H:%M"),
            "quantity_kg": current_load,
            "cumulative_load_kg": 0.0,
            "contact_name": destination.get("contact_name"),
            "contact_phone": destination.get("contact_phone"),
            "status": "PENDING",
        })

        return {
            "route_code": f"RT-{datetime.datetime.now().strftime('%d%m%H%M')}-{uuid.uuid4().hex[:6].upper()}",
            "driver_id": driver_id,
            "vehicle_capacity_kg": vehicle_capacity_kg,
            "current_load_kg": round(current_load, 2),
            "is_full": current_load >= vehicle_capacity_kg,
            "available_capacity_kg": round(max(0.0, vehicle_capacity_kg - current_load), 2),
            "total_distance_km": 0.0,
            "estimated_duration_mins": len(stops) * 40,
            "eta_text": current_time.strftime("%Y-%m-%d %H:%M"),
            "stops": stops,
        }

    @classmethod
    def apply_delay(cls, route_data: Dict[str, Any], delay_minutes: int, delay_reason: str) -> Dict[str, Any]:
        route_data["delay_minutes"] = delay_minutes
        route_data["delay_reason"] = delay_reason
        route_data["status"] = "DELAYED"
        return route_data
